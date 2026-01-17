import { supabase } from '../lib/supabaseClient';

const STORAGE_KEY = 'app_config';
const CLUB_ID = 'cdsciudadmurcia'; // For now single tenant

export const DEFAULT_CONFIG = {
    clubId: CLUB_ID,
    appTitle: 'Squash Ciudad de Murcia',
    appLogo: null,
    primaryColor: '#931c1f',
    accentColor: '#fbbf24',
    emailSubject: 'Renovación Cuota y Licencia 2026 - Squash Ciudad de Murcia',
    emailBody: `Hola {{nombre}},

Arrancamos este 2026 con más fuerza que nunca en el Squash Ciudad de Murcia y queremos contar contigo.

Este año queremos dar un salto de calidad y te animamos a renovar tu cuota y sacar la Licencia Federativa.

¿Por qué es importante federarse este año?
1. Ahorro para el club: Nos permite ahorrar unos 200€ en la organización de CADA torneo.
2. Amortización rápida: Recuperas el coste enseguida gracias a la reducción en precios de inscripción y seguros.
3. Seguridad: Incluye seguro médico deportivo para cualquier accidente en torneos.

📅 Calendario 2026:
Hemos proyectado 5 grandes eventos para este año:
- 3 Torneos Absolutos: Competición y convivencia (sábados por la mañana).
- 1 o 2 Torneos Junior: Para potenciar nuestra cantera.

Con la contribución de todos, haremos que el squash crezca en nuestra ciudad.

¡Esperamos tu renovación!

Un saludo,
La Directiva del Squash Ciudad de Murcia.`
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
            .upsert({
                id: CLUB_ID,
                name: configToSave.appTitle || 'Club',
                config: configToSave
            });

        if (error) throw error;
    } catch (err) {
        console.error("Error saving config to DB:", err);
        alert("Error al guardar la configuración en la nube. Los cambios solo están locales.");
    }

    return configToSave;
};

export const getClubId = () => CLUB_ID;
