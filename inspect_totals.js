const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTotals() {
  const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b'; // Cais

  const { data: resumos } = await supabase
    .from('faturamento_resumo_diario')
    .select('*')
    .eq('operacao_id', opId)
    .order('data_referencia', { ascending: false });

  // Calculate stats for Cais like frontend does for 30d
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isoLimit = thirtyDaysAgo.toISOString().split('T')[0];

  const periodResumos = resumos.filter(r => r.data_referencia >= isoLimit);

  const revenue = periodResumos.reduce((acc, r) => {
    return acc + (Number(r.total_receita_ajustada) || 0) + (Number(r.total_avulso_ajustado) || 0) + (Number(r.total_mensalista_ajustado) || 0);
  }, 0);

  console.log(`Total Revenue for Cais (Last 30 Days from resumos): R$ ${revenue}`);

  // Look at exactly 17/03
  const yestRes = resumos.filter(r => r.data_referencia === '2026-03-17');
  console.log('17/03 summaries count:', yestRes.length);
  if (yestRes.length > 0) {
    const sum = yestRes.reduce((acc, r) => acc + (Number(r.total_receita_ajustada) || 0) + (Number(r.total_avulso_ajustado) || 0) + (Number(r.total_mensalista_ajustado) || 0), 0);
    console.log(`Sum for 17/03: R$ ${sum}`);
  }

  // Look at exactly 18/03
  const todayRes = resumos.filter(r => r.data_referencia === '2026-03-18');
  console.log('18/03 summaries count:', todayRes.length);
  if (todayRes.length > 0) {
    const sum = todayRes.reduce((acc, r) => acc + (Number(r.total_receita_ajustada) || 0) + (Number(r.total_avulso_ajustado) || 0) + (Number(r.total_mensalista_ajustado) || 0), 0);
    console.log(`Sum for 18/03: R$ ${sum}`);
  }

  const { data: movs } = await supabase
    .from('faturamento_movimentos')
    .select('valor, data_saida, data_entrada, criado_em')
    .eq('operacao_id', opId)
    .gte('criado_em', '2026-03-17T00:00:00.000Z');

  console.log(`Fetched ${movs.length} movs from Cais created yesterday/today.`);
}

inspectTotals();
