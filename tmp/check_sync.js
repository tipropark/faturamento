
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSync() {
    const { data: ops } = await supabase
        .from('operacoes')
        .select(`
            id, nome_operacao, codigo_operacao, 
            habilitar_faturamento, automacao_sistema, automacao_arquitetura
        `)
        .order('atualizado_em', { ascending: false })
        .limit(3);

    ops.forEach(op => {
        console.log(`OP: ${op.nome_operacao} (${op.id})`);
        console.log(`  Sync: ${op.habilitar_faturamento}`);
        console.log(`  Sistema: ${op.automacao_sistema}`);
        console.log(`  Arq: ${op.automacao_arquitetura}`);
    });

    const { data: autos } = await supabase
        .from('operacoes_automacao')
        .select('operacao_id, habilitar_faturamento, arquitetura')
        .order('atualizado_em', { ascending: false })
        .limit(3);

    console.log('\n--- operacoes_automacao table ---');
    autos.forEach(a => {
        console.log(`ID: ${a.operacao_id} | Sync: ${a.habilitar_faturamento} | Arq: ${a.arquitetura}`);
    });
}

checkSync();
