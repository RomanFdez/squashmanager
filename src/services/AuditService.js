import { getStorageItem, setStorageItem } from './StorageService';

export const AUDIT_ACTIONS = {
    MEMBER_CREATE: 'alta_socio',
    MEMBER_UPDATE: 'edicion_socio',
    MEMBER_DELETE: 'baja_socio',
    TREASURY_CREATE: 'nuevo_movimiento',
    TREASURY_UPDATE: 'edicion_movimiento',
    TREASURY_DELETE: 'borrado_movimiento'
};

const STORAGE_KEY = 'club_audit_logs';

export const getAuditLogs = () => {
    const logs = getStorageItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
};

export const addAuditLog = (user, action, details) => {
    const logs = getAuditLogs();
    const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        user: user?.name || 'Sistema',
        action,
        details
    };
    setStorageItem(STORAGE_KEY, JSON.stringify([newLog, ...logs]));
};
