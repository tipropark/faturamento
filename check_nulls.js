const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkYesterdayNulls() {
  const { data: movs } = await supabase
    .from('faturamento_movimentos')
    .select('valor, data_saida, data_entrada, criado_em')
    .eq('operacao_id', 'e2cb938f-5578-4fca-b905-d9a844f3ca5b')
    .gte('criado_em', '2026-03-17T00:00:00.000Z')
    .lt('criado_em', '2026-03-18T00:00:00.000Z');
    
  console.log(`Found ${movs.length} total records from yesterday.`);
  
  const nulls = movs.filter(m => !m.data_saida && !m.data_entrada);
  console.log(`Found ${nulls.length} with BOTH data_saida and data_entrada NULL.`);

  const nullsSum = nulls.reduce((s, m) => s + Number(m.valor || 0), 0);
  console.log(`Sum of those NULLs: R$ ${nullsSum}`);
}
checkYesterdayNulls();
