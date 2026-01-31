import { supabase } from '../lib/supabaseClient';
import { getClubId } from './ConfigService';

export const AUDIT_ACTIONS = {
    MEMBER_CREATE: 'alta_socio',
    MEMBER_UPDATE: 'edicion_socio',
    MEMBER_DELETE: 'baja_socio',
    TREASURY_CREATE: 'nuevo_movimiento',
    TREASURY_UPDATE: 'edicion_movimiento',
    TREASURY_DELETE: 'borrado_movimiento'
};

export const getAuditLogs = async () => {
    const clubId = getClubId();
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('club_id', clubId)
        .order('timestamp', { ascending: false })
        .limit(100); // Limitar a los últimos 100 registros

    if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }

    // Mapear campos de la BD al formato esperado por la UI
    return data.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        user: log.user_name,
        action: log.action,
        details: log.details
    }));
};

export const addAuditLog = async (user, action, details) => {
    const clubId = getClubId();

    const { error } = await supabase
        .from('audit_logs')
        .insert({
            club_id: clubId,
            user_name: user?.name || 'Sistema',
            action,
            details
        });

    if (error) {
        console.error('Error adding audit log:', error);
    }
};
