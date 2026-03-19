const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCaisYesterdayDetailed() {
  const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
  const dateStr = '2026-03-17';

  // We want to count how many records actually belong to yesterday for this op
  const { data: movs } = await supabase
    .from('faturamento_movimentos')
    .select('id, valor, tipo_movimento, data_saida, data_entrada, criado_em')
    .eq('operacao_id', opId)
    .or(`data_saida.gte.${dateStr}T00:00:00,data_entrada.gte.${dateStr}T00:00:00,criado_em.gte.${dateStr}T00:00:00`);

  const filtered = movs.filter(m => {
    let eff = m.data_saida || m.data_entrada || m.criado_em || '';
    return eff.substring(0, 10) === dateStr;
  });

  console.log(`Cais Yesterday Actual Records: ${filtered.length}`);
  const total = filtered.reduce((acc, m) => {
      const v = Number(m.valor || 0);
      return acc + (m.tipo_movimento === 'Despesa' ? -v : v);
  }, 0);
  console.log(`Cais Yesterday Actual Sum: R$ ${total}`);
  
  // What is the summary record for this day?
  const { data: res } = await supabase
    .from('faturamento_resumo_diario')
    .select('total_receita_ajustada, total_avulso_ajustado, total_mensalista_ajustado, total_despesa_ajustada, resultado_liquido_ajustado')
    .eq('operacao_id', opId)
    .eq('data_referencia', dateStr);
    
  console.log('Summary record:', res[0]);
}

checkCaisYesterdayDetailed();
