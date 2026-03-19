
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCais() {
  try {
    // Buscar ID do Cais
    const { data: ops } = await supabase.from('operacoes').select('id, nome_operacao').ilike('nome_operacao', '%cais%');
    if (!ops || ops.length === 0) { console.log('Cais not found'); return; }
    const opId = ops[0].id;
    console.log(`Checking operation: ${ops[0].nome_operacao} (${opId})`);

    const { data: movs } = await supabase
      .from('faturamento_movimentos')
      .select('tipo_movimento, criado_em, data_saida, valor')
      .eq('operacao_id', opId)
      .limit(1000);

    const today = '2026-03-18';
    
    const bySaida = movs.filter(m => (m.data_saida || '').startsWith(today)).reduce((s, m) => s + Number(m.valor), 0);
    const byCriado = movs.filter(m => (m.criado_em || '').startsWith(today)).reduce((s, m) => s + Number(m.valor), 0);

    console.log(`Total (data_saida starts with ${today}): R$ ${bySaida}`);
    console.log(`Total (criado_em starts with ${today}): R$ ${byCriado}`);

  } catch (e) { console.error(e); }
}

checkCais();
