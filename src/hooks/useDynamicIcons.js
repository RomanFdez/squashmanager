import { useEffect } from 'react';
import { getConfig, fetchConfig } from '../services/ConfigService';

export const useDynamicIcons = () => {
    useEffect(() => {
        const updateIcons = () => {
            const config = getConfig();

            // Apply Colors to CSS Variables
            if (config.primaryColor) {
                document.documentElement.style.setProperty('--primary-color', config.primaryColor);
            }
            if (config.accentColor) {
                document.documentElement.style.setProperty('--accent-color', config.accentColor);
            }

            const logoUrl = config.appLogo;

            if (logoUrl) {
                // Update Favicon
                let favicon = document.querySelector("link[rel~='icon']");
                if (!favicon) {
                    favicon = document.createElement('link');
                    favicon.rel = 'icon';
                    document.head.appendChild(favicon);
                }
                favicon.href = logoUrl;

                // Update Apple Touch Icon (iPhone home screen)
                let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
                if (!appleIcon) {
                    appleIcon = document.createElement('link');
                    appleIcon.rel = 'apple-touch-icon';
                    document.head.appendChild(appleIcon);
                }
                appleIcon.href = logoUrl;
            }
        };

        // Initial load
        updateIcons(); // Load from local cache immediately
        fetchConfig(); // Fetch fresh config from DB (will trigger event)

        // Listen for config changes
        window.addEventListener('configUpdated', updateIcons);

        return () => {
            window.removeEventListener('configUpdated', updateIcons);
        };
    }, []);
};
