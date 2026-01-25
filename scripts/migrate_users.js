
// Script para migrar socios de la tabla 'members' a Supabase Auth
// Uso: node migrate_users.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// IMPORTANTE: Necesitas la SERVICE_ROLE_KEY para crear usuarios sin enviar email de confirmación
// y sin loguearte como ellos. NO USES LA ANON_KEY.
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Error: Faltan variables de entorno.');
    console.error('Asegúrate de tener VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu archivo .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function migrate() {
    console.log('🚀 Iniciando migración de usuarios...');

    // 1. Obtener todos los socios
    const { data: members, error } = await supabase
        .from('members')
        .select('*')
        .neq('status', 'inactive'); // Solo activos

    if (error) {
        console.error('Error leyendo socios:', error);
        return;
    }

    console.log(`📋 Encontrados ${members.length} socios activos.`);

    let successCount = 0;
    let errorCount = 0;

    for (const member of members) {
        if (!member.email) {
            console.warn(`⚠️ Socio ${member.name} saltado: Falta email.`);
            continue;
        }

        let passwordToUse = member.password;
        // Check for empty or very short passwords
        if (!passwordToUse || passwordToUse.trim().length < 6) {
            console.warn(`⚠️ Socio ${member.name} tiene contraseña inválida ("${member.password}"). Usando contraseña temporal: Squash2026!`);
            passwordToUse = "Squash2026!";

            // Update in members table so we know the password later (optional but useful)
            await supabase.from('members').update({ password: passwordToUse }).eq('id', member.id);
        }

        console.log(`procesando: ${member.name} (${member.email})...`);

        try {
            // 2. Crear usuario en Auth (Admin API)
            const { data: user, error: createError } = await supabase.auth.admin.createUser({
                email: member.email,
                password: passwordToUse,
                email_confirm: true, // Auto confirmar
                user_metadata: {
                    name: member.name,
                    role: member.role || 'Socio'
                }
            });

            if (createError) {
                // Si el error es que ya existe, intentamos actualizar sus datos/password
                if (createError.message.includes('already registered')) {
                    console.log(`   ℹ️ Usuario ya existe. Actualizando contraseña...`);
                    // Buscar ID
                    // Nota: listUsers no es eficiente para buscar uno, pero es lo que hay sin ID previo
                    // En vez de buscar, asumimos que existe y pasamos al siguiente o intentamos update si tuvieramos ID.
                    // Lo mejor es saltar.
                    console.log(`   ✅ Ya registrado. Saltando.`);
                } else {
                    console.error(`   ❌ Error creando usuario: ${createError.message}`);
                    errorCount++;
                }
            } else {
                console.log(`   ✅ Usuario creado correctamente (ID: ${user?.user?.id})`);
                successCount++;

                // Opcional: Guardar auth_id en la tabla members para referencia futura
                // await supabase.from('members').update({ auth_id: user.user.id }).eq('id', member.id);
            }

        } catch (err) {
            console.error(`   ❌ Error inesperado con ${member.email}:`, err);
            errorCount++;
        }
    }

    console.log('\n🏁 Migración finalizada.');
    console.log(`✅ Éxitos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
}

migrate();
