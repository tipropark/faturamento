
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findExec() {
    console.log('--- Probing RPCs via metadata ---');
    try {
        const { data, error } = await supabase.rpc('inspect_rpcs'); // This might work if I use params?
        console.log('inspect_rpcs without params:', error ? error.message : 'SUCCESS');
        
        const { data: d2, error: e2 } = await supabase.from('pg_proc').select('proname').ilike('proname', '%sql%');
        console.log('Searching in pg_proc:', e2 ? e2.message : d2?.map(r=>r.proname).join(', '));
    } catch (e) {
        console.log('Error:', e.message);
    }
}
findExec();
