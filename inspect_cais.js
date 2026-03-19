
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCaisDates() {
  try {
    const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
    const today = '2026-03-18';

    const { data: movs } = await supabase
      .from('faturamento_movimentos')
      .select('*')
      .eq('operacao_id', opId);

    const matchesSaida = movs.filter(m => (m.data_saida || '').startsWith(today));
    
    console.log(`There are ${matchesSaida.length} records with data_saida = ${today}. Total = ${matchesSaida.reduce((s,m) => s + Number(m.valor), 0)}`);
    
    // Check their criado_em
    const counts = {};
    matchesSaida.forEach(m => {
       const c = (m.criado_em || 'null').substring(0, 10);
       counts[c] = (counts[c] || 0) + 1;
    });
    console.log('Distribution of criado_em for these records:', counts);

  } catch (e) { console.error(e); }
}

inspectCaisDates();
