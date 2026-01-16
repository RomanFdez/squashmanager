import { addAuditLog, AUDIT_ACTIONS } from './AuditService';
import { supabase } from '../lib/supabaseClient';
import { getClubId } from './ConfigService';

// Helper to map DB columns to App Model
const mapFromDb = (m) => ({
    id: m.id,
    clubId: m.club_id,
    type: m.type,
    concept: m.concept,
    amount: parseFloat(m.amount),
    date: m.date,
    category: m.category,
    recurring: m.recurring
});

// Helper to map App Model to DB columns
const mapToDb = (m) => {
    const clubId = getClubId();
    return {
        // id: m.id, // Only for update
        club_id: clubId,
        type: m.type,
        concept: m.concept,
        amount: m.amount,
        date: m.date,
        category: m.category,
        recurring: !!m.recurring
    };
};

export const getMovements = async () => {
    const clubId = getClubId();
    const { data, error } = await supabase
        .from('treasury')
        .select('*')
        .eq('club_id', clubId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching treasury movements:', error);
        return [];
    }

    return data.map(mapFromDb);
};

export const saveMovement = async (currentUser, movementData) => {
    let action;
    let dataToSave = mapToDb(movementData);
    let result = null;

    if (movementData.id) {
        // Update
        const { data, error } = await supabase
            .from('treasury')
            .update(dataToSave)
            .eq('id', movementData.id)
            .select();

        if (error) throw error;
        result = data[0];
        action = AUDIT_ACTIONS.TREASURY_UPDATE;
    } else {
        // Create
        const { data, error } = await supabase
            .from('treasury')
            .insert(dataToSave)
            .select();

        if (error) throw error;
        result = data[0];
        action = AUDIT_ACTIONS.TREASURY_CREATE;
    }

    const savedMovement = mapFromDb(result);
    await addAuditLog(currentUser, action, `${savedMovement.type === 'income' ? 'Ingreso' : 'Gasto'}: ${savedMovement.concept} (${savedMovement.amount}€)`);
    return savedMovement;
};

export const deleteMovement = async (currentUser, movementId) => {
    // Get movement first for audit
    const { data: existingData } = await supabase
        .from('treasury')
        .select('*')
        .eq('id', movementId)
        .single();

    if (!existingData) return;

    const { error } = await supabase
        .from('treasury')
        .delete()
        .eq('id', movementId);

    if (error) {
        console.error('Error deleting movement:', error);
        return;
    }

    const movement = mapFromDb(existingData);
    await addAuditLog(currentUser, AUDIT_ACTIONS.TREASURY_DELETE, `Borrado ${movement.type === 'income' ? 'Ingreso' : 'Gasto'}: ${movement.concept}`);
};

export const calculateTotals = async (year) => {
    const allMovements = await getMovements();
    const currentYearMovements = allMovements.filter(m => new Date(m.date).getFullYear() === year);
    const previousMovements = allMovements.filter(m => new Date(m.date).getFullYear() < year);

    const initialBalance = previousMovements.reduce((sum, m) => {
        const amount = parseFloat(m.amount);
        return m.type === 'income' ? sum + amount : sum - amount;
    }, 0);

    const income = currentYearMovements.filter(m => m.type === 'income').reduce((sum, m) => sum + parseFloat(m.amount), 0);
    const expenses = currentYearMovements.filter(m => m.type === 'expense').reduce((sum, m) => sum + parseFloat(m.amount), 0);

    // Monthly breakdown
    const monthly = Array.from({ length: 12 }, (_, i) => {
        const monthMovements = currentYearMovements.filter(m => new Date(m.date).getMonth() === i);
        const mIncome = monthMovements.filter(m => m.type === 'income').reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);
        const mExpense = monthMovements.filter(m => m.type === 'expense').reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);
        return {
            month: new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(year, i)),
            income: mIncome,
            expenses: mExpense,
            total: mIncome - mExpense
        };
    });

    return {
        initialBalance,
        totalIncome: income,
        totalExpenses: expenses,
        balance: initialBalance + income - expenses,
        monthly
    };
};
