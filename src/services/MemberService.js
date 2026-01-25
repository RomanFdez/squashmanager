import { addAuditLog, AUDIT_ACTIONS } from './AuditService';
import { formatMemberNumber } from '../utils/validators';
import { supabase } from '../lib/supabaseClient';
import { getClubId } from './ConfigService';

// Helper to map DB columns (snake_case) to App Model (camelCase)
const mapFromDb = (m) => ({
    id: m.id,
    clubId: m.club_id,
    memberNumber: m.member_number,
    name: m.name,
    dni: m.dni,
    role: m.role,
    type: m.type,
    status: m.status,
    isPaid: m.is_paid,
    photo: m.photo_url,
    leaveDate: m.leave_date,
    email: m.email,
    phone: m.phone,
    address: m.address,
    licenseRegional: m.license_regional,
    licenseNational: m.license_national,
    isSchoolEnrolled: m.is_school_enrolled,
    guardianName: m.guardian_name,
    guardianDni: m.guardian_dni,
    guardianPhone: m.guardian_phone,
    guardianEmail: m.guardian_email,
    birthDate: m.birth_date
});

// Helper to map App Model to DB columns
const mapToDb = (m) => {
    const clubId = getClubId();
    return {
        // id: m.id, // Only include if updating, handled by logic below
        club_id: clubId,
        member_number: m.memberNumber,
        name: m.name,
        dni: m.dni,
        role: m.role,
        type: m.type,
        status: m.status,
        is_paid: m.isPaid,
        photo_url: m.photo,
        leave_date: m.leaveDate || null, // Fix: Postgres rejects empty string for date
        email: m.email,
        phone: m.phone,
        address: m.address,
        license_regional: m.licenseRegional,
        license_national: m.licenseNational,
        is_school_enrolled: m.isSchoolEnrolled,
        guardian_name: m.guardianName,
        guardian_dni: m.guardianDni,
        guardian_phone: m.guardianPhone,
        guardian_email: m.guardianEmail,
        birth_date: m.birthDate || null
    };
};

export const getMembers = async () => {
    const clubId = getClubId();
    const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('club_id', clubId);

    if (error) {
        console.error('Error fetching members:', error);
        return [];
    }

    return data.map(mapFromDb);
};

export const getNextMemberNumber = async () => {
    try {
        const { data: members, error } = await supabase
            .from('members')
            .select('member_number')
            .eq('club_id', getClubId());

        if (error) {
            console.error('Error fetching member numbers:', error);
            return '001';
        }

        if (!members || members.length === 0) return '001';

        const numbers = members.map(m => parseInt(m.member_number || '0'));
        const max = Math.max(...numbers);
        return formatMemberNumber(max + 1);
    } catch (e) {
        console.error('Exception calculating next member number:', e);
        return '001';
    }
};

export const saveMember = async (currentUser, memberData) => {
    let action;
    let dataToSave = mapToDb(memberData);
    let result = null;

    if (memberData.id) {
        // Update
        const { data, error } = await supabase
            .from('members')
            .update(dataToSave)
            .eq('id', memberData.id)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("La actualización no devolvió datos. Verifica permisos RLS.");
        result = data[0];
        action = AUDIT_ACTIONS.MEMBER_UPDATE;
    } else {
        // Create
        if (!dataToSave.member_number) {
            dataToSave.member_number = await getNextMemberNumber();
        }

        const { data, error } = await supabase
            .from('members')
            .insert(dataToSave)
            .select();

        if (error) {
            console.error('Supabase INSERT Error:', error);
            throw error;
        }
        if (!data || data.length === 0) throw new Error("La creación no devolvió datos. Verifica permisos RLS.");
        result = data[0];
        action = AUDIT_ACTIONS.MEMBER_CREATE;
    }

    const savedMember = mapFromDb(result);
    // Audit is async, fire and forget (or await if critical)
    if (currentUser) {
        await addAuditLog(currentUser, action, `Socio: ${savedMember.name} (#${savedMember.memberNumber})`);
    }
    return savedMember;
};

export const deleteMember = async (currentUser, memberId) => {
    const { data, error } = await supabase
        .from('members')
        .update({
            status: 'inactive',
            leave_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', memberId)
        .select();

    if (error) {
        console.error('Error soft deleting member:', error);
        return;
    }

    const member = mapFromDb(data[0]);
    await addAuditLog(currentUser, AUDIT_ACTIONS.MEMBER_DELETE, `Baja socio: ${member.name} (#${member.memberNumber})`);
};

export const removeMember = async (currentUser, memberId) => {
    // First get details for audit
    // Using single query if possible, but delete returns the deleted rows
    const { data, error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId)
        .select();

    if (error) {
        console.error('Error removing member:', error);
        return;
    }

    if (data && data.length > 0) {
        const member = mapFromDb(data[0]);
        await addAuditLog(currentUser, AUDIT_ACTIONS.MEMBER_DELETE, `ELIMINADO socio: ${member.name} (#${member.memberNumber})`);
    }
};

export const resetPaymentStatus = async (currentUser) => {
    const clubId = getClubId();
    const { error } = await supabase
        .from('members')
        .update({ is_paid: false })
        .eq('club_id', clubId);

    if (error) {
        console.error('Error resetting payments:', error);
        return;
    }

    await addAuditLog(currentUser, AUDIT_ACTIONS.MEMBER_UPDATE, 'Todos los socios marcados como pendientes de pago');
};

export const canDeactivateAdmin = async (memberId) => {
    const members = await getMembers();
    const activeMembers = members.filter(m => m.status !== 'inactive');
    const member = activeMembers.find(m => m.id === memberId);

    if (!member) return true; // not found, safe to ignore

    const adminRoles = ['Presidente', 'Secretario', 'Tesorero'];
    if (!adminRoles.includes(member.role)) return true;

    const otherAdmins = activeMembers.filter(m =>
        m.id !== memberId && adminRoles.includes(m.role)
    );

    return otherAdmins.length > 0;
};
