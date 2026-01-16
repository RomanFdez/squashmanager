import React, { createContext, useContext, useState, useEffect } from 'react';
import { getConfig, saveConfig } from '../services/ConfigService';

const ClubContext = createContext();

export const useClub = () => useContext(ClubContext);

export const ClubProvider = ({ children }) => {
    const [config, setConfig] = useState(getConfig());

    useEffect(() => {
        // Initial load
        applyTheme(config);

        // Listen for updates (e.g. from Admin page)
        const handleConfigUpdate = (event) => {
            const newConfig = event.detail;
            setConfig(newConfig);
            applyTheme(newConfig);
        };

        window.addEventListener('configUpdated', handleConfigUpdate);
        return () => window.removeEventListener('configUpdated', handleConfigUpdate);
    }, []);

    const applyTheme = (themeConfig) => {
        const root = document.documentElement;
        if (themeConfig.primaryColor) {
            root.style.setProperty('--primary-color', themeConfig.primaryColor);
        }
        if (themeConfig.accentColor) {
            root.style.setProperty('--accent-color', themeConfig.accentColor);
        }
    };

    const updateClubConfig = (newSettings) => {
        const updated = saveConfig(newSettings);
        setConfig(updated);
    };

    return (
        <ClubContext.Provider value={{ config, updateClubConfig }}>
            {children}
        </ClubContext.Provider>
    );
};
