
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFix() {
    console.log('--- Applying Faturamento Trigger Fix ---');
    
    const sqlPath = 'c:/VibeCoding/leve-erp/supabase/evolution_faturamento_v5_resumo_ajustes.sql';
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Tentar exec_sql primeiro
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
        console.error('Error applying fix via exec_sql:', error.message);
        console.log('Trying run_sql...');
        const { error: error2 } = await supabase.rpc('run_sql', { sql });
        if (error2) {
            console.error('Error applying fix via run_sql:', error2.message);
        } else {
            console.log('SUCCESS via run_sql!');
        }
    } else {
        console.log('SUCCESS via exec_sql!');
    }
}

runFix();
