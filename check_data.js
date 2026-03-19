
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  try {
    const { data: movs, error } = await supabase
      .from('faturamento_movimentos')
      .select('tipo_movimento, forma_pagamento, valor, criado_em, data_saida')
      .order('criado_em', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching movimentos:', error);
      return;
    }

    console.log(`Fetched ${movs.length} total movimentos from the last 100.`);
    
    const distribution = movs.reduce((acc, m) => {
      const key = `${m.tipo_movimento} | ${m.forma_pagamento}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    console.log('Distribution (Tipo | Forma):', JSON.stringify(distribution, null, 2));

    const uniqueTipos = [...new Set(movs.map(m => m.tipo_movimento))];
    console.log('Unique tipos:', uniqueTipos);
  } catch (e) {
    console.error('Runtime error:', e);
  }
}

checkData();
