const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdjustments() {
  const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
  const dateStr = '2026-03-17';

  const { data: adjustments } = await supabase
    .from('faturamento_ajustes')
    .select('*')
    .eq('operacao_id', opId)
    .eq('data_referencia', dateStr)
    .eq('status', 'Aprovado');

  const totalAju = adjustments.reduce((acc, a) => acc + (a.valor * a.sinal), 0);
  console.log(`Adjustments for Cais yesterday: R$ ${totalAju}`);
  console.log('List of adjustments:', adjustments);
}

checkAdjustments();
