import { getConfig } from './ConfigService';

// This service is the gateway to storage, handling tenant isolation.
// Currently wraps localStorage, but designed to be swapped for an API/DB later.

const getClubPrefix = () => {
    const { clubId } = getConfig();
    return clubId ? `${clubId}_` : 'default_'; // e.g. 'cdsciudadmurcia_members'
};

export const getStorageItem = (key) => {
    const prefixedKey = `${getClubPrefix()}${key}`;
    const item = localStorage.getItem(prefixedKey);

    // Fallback for migration: if not found with prefix, check legacy key
    if (!item && localStorage.getItem(key)) {
        // We could auto-migrate here, but for now just return legacy if exists
        // Ideally we should move it to prefixed key
        const legacyItem = localStorage.getItem(key);
        // localStorage.setItem(prefixedKey, legacyItem); // Optional: auto-migrate
        return legacyItem;
    }
    return item;
};

export const setStorageItem = (key, value) => {
    const prefixedKey = `${getClubPrefix()}${key}`;
    localStorage.setItem(prefixedKey, value);
};

export const removeStorageItem = (key) => {
    const prefixedKey = `${getClubPrefix()}${key}`;
    localStorage.removeItem(prefixedKey);
};

// Utilities for "admin" or global storage (not club specific)
export const getGlobalItem = (key) => localStorage.getItem(key);
export const setGlobalItem = (key, value) => localStorage.setItem(key, value);
