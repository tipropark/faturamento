
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listRpcs() {
    console.log('--- RPC List ---');
    try {
        const { data, error } = await supabase.rpc('inspect_rpcs'); 
        if (error) {
            console.error('inspect_rpcs error:', error.message);
        } else {
            console.log('Available RPCs:', data?.map(r => r.name).join(', ') || 'NONE');
        }
    } catch (e) {
        console.error('inspect_rpcs exception:', e.message);
    }
}

listRpcs();
