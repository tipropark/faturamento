
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    const names = ['exec_sql', 'run_sql', 'query_sql', 'execute_sql', 'sql'];
    for (const name of names) {
        process.stdout.write(`Testing ${name}... `);
        try {
            const { data, error } = await supabase.rpc(name, { sql: 'SELECT 1 as result' });
            if (error) {
                console.log(`ERROR: ${error.message}`);
                // Tenta com 'query' como params
                const { error: error2 } = await supabase.rpc(name, { query: 'SELECT 1 as result' });
                if (!error2) {
                    console.log(`SUCCESS with 'query' parameter!`);
                    return;
                }
            } else {
                console.log(`SUCCESS with 'sql' parameter! Data: ${JSON.stringify(data)}`);
                return;
            }
        } catch (e) {
            console.log(`EXCEPTION: ${e.message}`);
        }
    }
}

probe();
