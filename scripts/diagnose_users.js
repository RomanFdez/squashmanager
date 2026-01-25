
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function diagnose() {
    console.log('🔍 Diagnosticando socios problemáticos...');

    // Nombres parciales para buscar
    const problemNames = [
        'Agustín Alcázar',
        'José Francisco Serrano',
        'Pedro Antonio Martinez'
    ];

    const { data: members, error } = await supabase
        .from('members')
        .select('id, name, email, password');

    if (error) {
        console.error("Error BD:", error);
        return;
    }

    const problemMembers = members.filter(m =>
        problemNames.some(name => m.name.toLowerCase().includes(name.toLowerCase()))
    );

    console.log(`\nEncontrados ${problemMembers.length} coincidencias:\n`);

    problemMembers.forEach(m => {
        console.log(`👤 ${m.name}`);
        console.log(`   Email:    "${m.email}" (${typeof m.email})`);
        console.log(`   Password: "${m.password}" (${typeof m.password})`);

        let issues = [];
        if (!m.email) issues.push("Falta Email");
        if (m.email === "") issues.push("Email vacío");
        if (!m.password) issues.push("Falta Password");
        if (m.password === "") issues.push("Password vacío");

        if (issues.length > 0) {
            console.log(`   ⚠️ PROBLEMAS: ${issues.join(', ')}`);
        } else {
            console.log(`   ✅ Parece correcto (¿Espacios?)`);
        }
        console.log('---');
    });
}

diagnose();
