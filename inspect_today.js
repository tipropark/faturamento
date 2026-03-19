
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCaisToday() {
  try {
    const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
    const day = '2026-03-18';

    const { data: movs } = await supabase
      .from('faturamento_movimentos')
      .select('*')
      .eq('operacao_id', opId)
      .or(`data_saida.gte.${day}T00:00:00,criado_em.gte.${day}T00:00:00`);

    console.log(`Analyzing ${movs.length} records related to Today`);
    
    const bySaida = movs.filter(m => (m.data_saida || '').startsWith(day));
    const byCriado = movs.filter(m => (m.criado_em || '').startsWith(day));
    
    console.log(`- By data_saida = ${day}: Total R$ ${bySaida.reduce((s,m) => s+Number(m.valor), 0)} (${bySaida.length} records)`);
    console.log(`- By criado_em  = ${day}: Total R$ ${byCriado.reduce((s,m) => s+Number(m.valor), 0)} (${byCriado.length} records)`);
    
    // Check overlapping
    const onlySaida = bySaida.filter(s => !byCriado.some(c => c.id === s.id));
    const onlyCriado = byCriado.filter(c => !bySaida.some(s => s.id === c.id));
    const both = bySaida.filter(s => byCriado.some(c => c.id === s.id));
    
    console.log(`  - Only Saida Today: ${onlySaida.length} records (Sum: R$ ${onlySaida.reduce((s,m) => s+Number(m.valor), 0)})`);
    console.log(`  - Only Criado Today: ${onlyCriado.length} records (Sum: R$ ${onlyCriado.reduce((s,m) => s+Number(m.valor), 0)})`);
    console.log(`  - Both Today: ${both.length} records (Sum: R$ ${both.reduce((s,m) => s+Number(m.valor), 0)})`);

  } catch (e) { console.error(e); }
}

inspectCaisToday();
