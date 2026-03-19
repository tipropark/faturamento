const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRawMovs() {
  const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
  const dateStr = '2026-03-17';

  const { data: movs } = await supabase
    .from('faturamento_movimentos')
    .select('id, valor, tipo_movimento, data_saida, data_entrada, criado_em')
    .eq('operacao_id', opId)
    .ilike('data_saida', `%${dateStr}%`);

  console.log(`Found ${movs.length} with data_saida on ${dateStr}`);
  console.log('Sample:', movs.slice(0, 5));
  console.log('Total Sum of these:', movs.reduce((s, m) => s+Number(m.valor), 0));

  const { data: movs2 } = await supabase
    .from('faturamento_movimentos')
    .select('id, valor, tipo_movimento, data_saida, data_entrada, criado_em')
    .eq('operacao_id', opId)
    .ilike('criado_em', `%${dateStr}%`);
  console.log(`Found ${movs2.length} with criado_em on ${dateStr}`);
  console.log('Total Sum of these:', movs2.reduce((s, m) => s+Number(m.valor), 0));
}

checkRawMovs();
