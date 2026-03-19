
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTodayCount() {
  try {
    const today = '2026-03-18';

    const { count, error } = await supabase
      .from('faturamento_movimentos')
      .select('*', { count: 'exact', head: true })
      .or(`data_saida.gte.${today}T00:00:00,criado_em.gte.${today}T00:00:00`);

    console.log(`Total movements across ALL operations Today (March 18): ${count}`);

  } catch (e) { console.error(e); }
}

checkTodayCount();
