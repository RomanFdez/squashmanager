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
                const updateLink = (rel) => {
                    let link = document.querySelector(`link[rel='${rel}']`);
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = rel;
                        document.head.appendChild(link);
                    }
                    link.href = logoUrl;
                };

                updateLink('icon');
                updateLink('shortcut icon');
                updateLink('apple-touch-icon');
                updateLink('apple-touch-icon-precomposed');
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
