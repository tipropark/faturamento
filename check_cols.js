
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
  try {
    const { data: movs } = await supabase
      .from('faturamento_movimentos')
      .select('*')
      .limit(1);

    if (movs?.[0]) console.log('Columns:', Object.keys(movs[0]));
    console.log('Sample record:', JSON.stringify(movs?.[0], null, 2));

  } catch (e) {
    console.error(e);
  }
}

checkCols();
