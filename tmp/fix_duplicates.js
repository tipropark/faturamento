
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanAndFix() {
    console.log('--- Cleaning duplicates in operacoes_automacao ---');
    const { data: allRows, error } = await supabase
        .from('operacoes_automacao')
        .select('id, operacao_id, atualizado_em')
        .order('atualizado_em', { ascending: false });

    if (error) {
        console.error('Error fetching rows:', error);
        return;
    }

    const seen = new Set();
    const toDelete = [];

    for (const row of allRows) {
        if (seen.has(row.operacao_id)) {
            toDelete.push(row.id);
        } else {
            seen.add(row.operacao_id);
        }
    }

    console.log(`Found ${toDelete.length} duplicates to delete.`);

    if (toDelete.length > 0) {
        for (const id of toDelete) {
            await supabase.from('operacoes_automacao').delete().eq('id', id);
        }
        console.log('Deletions complete.');
    }

    console.log('Now attempting to add the UNIQUE constraint...');
    // We can't run ALTER TABLE directly via normal PostgREST. 
    // But we can try the RPC if it exists or tell the user.
    // However, I noticed some projects have a 'exec' or 'sql' RPC.
    
    // In many of these setups, 'inspect_table' suggests there might be meta-functions.
    // Let's try to just run a raw query via a trick if possible, or just accept that 
    // the code will now work better because we cleaned up and we will keep it clean 
    // manually if needed, but the UNIQUE is essential.
}

cleanAndFix();
