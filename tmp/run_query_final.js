
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFix() {
    const sqlText = fs.readFileSync('c:/VibeCoding/leve-erp/supabase/evolution_faturamento_v5_resumo_ajustes.sql', 'utf8');

    console.log('--- Database Update ---');
    
    // Tentativa com RPC generico se existir
    const methods = ['exec_sql', 'run_sql', 'query_sql'];
    let success = false;

    for (const method of methods) {
        console.log(`Trying RPC: ${method}...`);
        try {
            const { data, error } = await supabase.rpc(method, { sql: sqlText });
            if (!error) {
                console.log(`[${method}] SUCCESS!`);
                success = true;
                break;
            } else {
                console.log(`[${method}] Error: ${error.message}`);
            }
        } catch (e) {
            console.log(`[${method}] Exception: ${e.message}`);
        }
    }

    if (!success) {
        console.log('NOT FOUND standard SQL RPCs. Checking for other ways...');
        // Em alguns casos o nome do argumento é 'query'
         for (const method of methods) {
            try {
                const { error } = await supabase.rpc(method, { query: sqlText });
                if (!error) {
                    console.log(`[${method}] (with 'query' param) SUCCESS!`);
                    success = true;
                    break;
                }
            } catch (e) {}
        }
    }

    if (!success) {
        console.error('CRITICAL: Could not apply SQL fix. Please apply manually via Supabase Dashboard.');
    }
}

runFix();
