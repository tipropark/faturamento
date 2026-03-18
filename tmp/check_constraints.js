
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    console.log('--- Checking Constraints for operacoes_automacao ---');
    const { data: constraints, error } = await supabase.rpc('inspect_constraints', { t_name: 'operacoes_automacao' });
    
    if (error) {
        console.log('RPC failed, trying query on information_schema...');
        const { data, error: err2 } = await supabase.from('pg_constraint_query').select('*'); // This won't work easily via PostgREST
        
        // Let's try to just insert a duplicate to see what happens
        console.log('Testing UNIQUE constraint by trying a duplicate insert...');
        const { data: first } = await supabase.from('operacoes').select('id').limit(1).single();
        if (first) {
            const { error: err3 } = await supabase.from('operacoes_automacao').insert({ operacao_id: first.id });
            if (err3 && err3.code === '23505') {
                console.log('SUCCESS: UNIQUE constraint on operacao_id is working (received 23505 duplicate key)');
            } else if (err3) {
                console.log('Received error:', err3.code, err3.message);
            } else {
                console.log('Error: Inserted duplicate successfully! Constraint is MISSING!');
            }
        }
    } else {
        console.log(constraints);
    }
}

checkConstraints();
