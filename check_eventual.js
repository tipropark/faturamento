
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventual() {
  try {
    const { data: movs } = await supabase
      .from('faturamento_movimentos')
      .select('tipo_movimento, natureza, tickets_status')
      .or('tipo_movimento.ilike.%eventual%,tipo_movimento.ilike.%liberacao%')
      .limit(10);

    console.log('Sample Eventual/Liberacao records:', JSON.stringify(movs, null, 2));

    const { data: all } = await supabase.from('faturamento_movimentos').select('tipo_movimento').limit(100);
    console.log('Sample types:', [...new Set(all.map(m => m.tipo_movimento))]);
  } catch (e) {
    console.error(e);
  }
}

checkEventual();
