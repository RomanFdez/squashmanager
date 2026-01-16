const STORAGE_KEY = 'app_config';

const DEFAULT_CONFIG = {
    clubId: 'cdsciudadmurcia',
    appTitle: 'Squash Ciudad de Murcia',
    appLogo: null,
    primaryColor: '#931c1f', // Default Red
    accentColor: '#fbbf24', // Default Amber
};

export const getConfig = () => {
    const config = localStorage.getItem(STORAGE_KEY);
    return config ? { ...DEFAULT_CONFIG, ...JSON.parse(config) } : DEFAULT_CONFIG;
};

export const saveConfig = (newConfig) => {
    const current = getConfig();
    const config = { ...current, ...newConfig };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    // Dispatch custom event to notify listeners
    window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));
    return config;
};

// Helper for multi-tenant future
export const getClubId = () => {
    return getConfig().clubId;
};
