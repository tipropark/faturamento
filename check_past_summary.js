
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPastSummary() {
  try {
    const { data: resumos } = await supabase
      .from('faturamento_resumo_diario')
      .select('*')
      .eq('data_referencia', '2026-02-19');

    console.log('Summary for 2026-02-19:', JSON.stringify(resumos, null, 2));

  } catch (e) {
    console.error(e);
  }
}

checkPastSummary();
