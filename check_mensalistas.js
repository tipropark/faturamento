
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  try {
    const { count, error } = await supabase
      .from('faturamento_movimentos')
      .select('*', { count: 'exact', head: true })
      .filter('tipo_movimento', 'ilike', '%mensalista%');

    if (error) {
      console.error('Error counting mensalistas:', error);
      return;
    }

    console.log(`Total mensalista records in table: ${count}`);

    const { data: sample, error: err2 } = await supabase
      .from('faturamento_movimentos')
      .select('tipo_movimento, forma_pagamento, valor')
      .filter('tipo_movimento', 'ilike', '%mensalista%')
      .limit(5);

    if (sample) console.log('Sample Mensalistas:', sample);

    // Distribution of all types
    const { data: types } = await supabase.rpc('get_distinct_types_counts'); // If rpc not exist, use select
    if (!types) {
       const { data: allTypes } = await supabase.from('faturamento_movimentos').select('tipo_movimento');
       const distribution = allTypes.reduce((acc, m) => {
         acc[m.tipo_movimento] = (acc[m.tipo_movimento] || 0) + 1;
         return acc;
       }, {});
       console.log('All Types Distribution:', distribution);
    }
  } catch (e) {
    console.error('Runtime error:', e);
  }
}

checkData();
