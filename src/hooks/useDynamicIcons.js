import { useEffect } from 'react';
import { getConfig } from '../services/ConfigService';

export const useDynamicIcons = () => {
    useEffect(() => {
        const updateIcons = () => {
            const config = getConfig();
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

        // Run on mount
        updateIcons();

        // Listen for config changes (custom event dispatched by ConfigService)
        window.addEventListener('configUpdated', updateIcons);

        return () => {
            window.removeEventListener('configUpdated', updateIcons);
        };
    }, []);
};
