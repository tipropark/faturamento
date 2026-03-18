
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecific() {
    const { data: op } = await supabase
        .from('operacoes')
        .select('*')
        .eq('id', 'c4b24c6c-59a0-4782-9289-c61f15432c95')
        .single();
    if (op) {
        console.log(`Op Name: ${op.nome_operacao}`);
        console.log(`Legacy Sync: ${op.habilitar_faturamento}`);
    } else {
        console.log('Op not found');
    }
}

checkSpecific();
