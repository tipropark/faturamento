const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTop20k() {
  const dataLimiteBuffer = new Date();
  dataLimiteBuffer.setDate(dataLimiteBuffer.getDate() - 3);
  const isoLimiteBuffer = dataLimiteBuffer.toISOString();

  const { data: movimentos } = await supabase
    .from('faturamento_movimentos')
    .select('operacao_id, criado_em')
    .or(`data_saida.gte.${isoLimiteBuffer},data_entrada.gte.${isoLimiteBuffer},criado_em.gte.${isoLimiteBuffer}`)
    .order('criado_em', { ascending: false })
    .limit(20000);

  const dates = movimentos.map(m => m.criado_em ? m.criado_em.substring(0, 10) : 'none');
  const groups = dates.reduce((acc, d) => {
      acc[d] = (acc[d] || 0) + 1;
      return acc;
  }, {});
  console.log('Dates distribution in top 20000:', groups);

  const oldest = movimentos[movimentos.length-1].criado_em;
  console.log('Oldest record in top 20000:', oldest);
}
testTop20k();
