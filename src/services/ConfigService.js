import { supabase } from '../lib/supabaseClient';

const STORAGE_KEY = 'app_config';
const CLUB_ID = 'cdsciudadmurcia'; // For now single tenant

export const DEFAULT_CONFIG = {
    clubId: CLUB_ID,
    appTitle: 'Squash Ciudad de Murcia',
    appLogo: null,
    primaryColor: '#931c1f',
    accentColor: '#fbbf24',
};

// Sync getter (from local cache) - useful for initial render
export const getConfig = () => {
    const config = localStorage.getItem(STORAGE_KEY);
    return config ? { ...DEFAULT_CONFIG, ...JSON.parse(config) } : DEFAULT_CONFIG;
};

// Async fetch (Source of Truth)
export const fetchConfig = async () => {
    try {
        const { data, error } = await supabase
            .from('clubs')
            .select('config')
            .eq('id', CLUB_ID)
            .single();

        if (error) {
            console.error("Error fetching config from DB:", error);
            // If error (e.g. offline), fallback to local
            return getConfig();
        }

        if (data && data.config) {
            const merged = { ...DEFAULT_CONFIG, ...data.config };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            // Notify listeners (like useDynamicIcons)
            window.dispatchEvent(new CustomEvent('configUpdated', { detail: merged }));
            return merged;
        }
    } catch (err) {
        console.error("Error fetching config:", err);
    }
    return getConfig();
};

// Save to DB and Local
export const saveConfig = async (newConfig) => {
    const current = getConfig();
    const configToSave = { ...current, ...newConfig };

    // Optimistic update
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
    window.dispatchEvent(new CustomEvent('configUpdated', { detail: configToSave }));

    try {
        const { error } = await supabase
            .from('clubs')
            .update({ config: configToSave })
            .eq('id', CLUB_ID);

        if (error) throw error;
    } catch (err) {
        console.error("Error saving config to DB:", err);
        alert("Error al guardar la configuración en la nube. Los cambios solo están locales.");
    }

    return configToSave;
};

export const getClubId = () => CLUB_ID;
