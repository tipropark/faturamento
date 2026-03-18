
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearOldFaturamento() {
    console.log('--- Iniciando limpeza controlada de Faturamento ---');
    console.log('Objetivo: Manter apenas registros de Ontem (2026-03-16) e Hoje (2026-03-17)');

    // Definindo o limite: Início de ontem (2026-03-16 00:00:00 no horário de Brasília / -03:00)
    // Em UTC isso costuma ser 03:00 do mesmo dia, mas usar a string ISO '2026-03-16' o banco costuma interpretar como 00:00:00.
    const thresholdDate = '2026-03-16T00:00:00-03:00';

    console.log(`Removendo registros anteriores a: ${thresholdDate}`);

    // Primeiro, vamos ver quantos registros temos no total
    const { count: totalBefore } = await supabase
        .from('faturamento_movimentos')
        .select('*', { count: 'exact', head: true });

    console.log(`Total de registros atual: ${totalBefore}`);

    // Executando a exclusão
    // Diferente do anterior, vamos deletar onde data_saida < threshold OU (data_saida é nulo e data_entrada < threshold)
    
    // Passo 1: Deletar onde data_saida existe e é antiga
    const { count: deleted1, error: err1 } = await supabase
        .from('faturamento_movimentos')
        .delete({ count: 'exact' })
        .lt('data_saida', thresholdDate);

    if (err1) {
        console.error('Erro ao deletar por data_saida:', err1.message);
    } else {
        console.log(`✓ Registros removidos por data_saida: ${deleted1}`);
    }

    // Passo 2: Deletar onde data_saida é nula mas data_entrada existe e é antiga
    const { count: deleted2, error: err2 } = await supabase
        .from('faturamento_movimentos')
        .delete({ count: 'exact' })
        .is('data_saida', null)
        .lt('data_entrada', thresholdDate);

    if (err2) {
        console.error('Erro ao deletar por data_entrada (saida nula):', err2.message);
    } else {
        console.log(`✓ Registros removidos por data_entrada (sem saida): ${deleted2}`);
    }

    // Passo 3: Limpeza de fallback (registros sem nenhuma data válida que sejam "antigos" pela criação)
    const { count: deleted3, error: err3 } = await supabase
        .from('faturamento_movimentos')
        .delete({ count: 'exact' })
        .is('data_saida', null)
        .is('data_entrada', null)
        .lt('criado_em', thresholdDate);

    if (err3) {
        console.error('Erro ao deletar por criado_em:', err3.message);
    } else {
        console.log(`✓ Registros sem datas operacionais removidos: ${deleted3}`);
    }

    const { count: totalAfter } = await supabase
        .from('faturamento_movimentos')
        .select('*', { count: 'exact', head: true });

    console.log(`--- Limpeza concluída ---`);
    console.log(`Registros restantes na base: ${totalAfter}`);
    console.log(`Total removido: ${totalBefore - totalAfter}`);
}

clearOldFaturamento();
