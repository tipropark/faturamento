const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findMissing731() {
  const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
  const dateStr = '2026-03-17';

  // Get ALL records for this op and check manually
  const { data: movs } = await supabase
    .from('faturamento_movimentos')
    .select('*')
    .eq('operacao_id', opId);

  console.log(`Total records for Cais in DB: ${movs.length}`);

  const yesterday = movs.filter(m => {
    let sa = m.data_saida || '';
    let en = m.data_entrada || '';
    let cr = m.criado_em || '';
    let eff = sa || en || cr;
    return eff.substring(0, 10) === dateStr;
  });

  console.log(`Manual Scan Yesterday count: ${yesterday.length}`);
  const sum = yesterday.reduce((s, m) => s + (m.tipo_movimento === 'Despesa' ? -Number(m.valor) : Number(m.valor)), 0);
  console.log(`Manual Scan Yesterday Sum: R$ ${sum}`);

  // If common sum is 865, where are the others?
  // Let's check for "Today" too
  const todayStr = '2026-03-18';
  const today = movs.filter(m => {
    let sa = m.data_saida || '';
    let en = m.data_entrada || '';
    let cr = m.criado_em || '';
    let eff = sa || en || cr;
    return eff.substring(0, 10) === todayStr;
  });
  console.log(`Manual Scan Today count: ${today.length}`);
  const todaySum = today.reduce((s, m) => s + (m.tipo_movimento === 'Despesa' ? -Number(m.valor) : Number(m.valor)), 0);
  console.log(`Manual Scan Today Sum: R$ ${todaySum}`);

}

findMissing731();
