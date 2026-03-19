const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testILike() {
  const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
  const date = '2026-03-18';

  const { data, error } = await supabase
    .from('faturamento_movimentos')
    .select('id, data_saida')
    .eq('operacao_id', opId)
    .or(`data_saida.ilike.${date}%,data_entrada.ilike.${date}%,criado_em.ilike.${date}%`)
    .limit(10);

  if (error) {
     console.log('Error with ilike:', error.message);
  } else {
     console.log(`Success! Found ${data.length} records with ilike.`);
  }
}

async function testGteLte() {
  const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
  const date = '2026-03-18';

  // Standard Range approach for timestamp
  const { data, error } = await supabase
    .from('faturamento_movimentos')
    .select('id')
    .eq('operacao_id', opId)
    .or(`data_saida.gte.${date}T00:00:00,data_entrada.gte.${date}T00:00:00,criado_em.gte.${date}T00:00:00`)
    .or(`data_saida.lte.${date}T23:59:59,data_entrada.lte.${date}T23:59:59,criado_em.lte.${date}T23:59:59`)
    .limit(10);

   if (error) {
     console.log('Error with Range:', error.message);
  } else {
     console.log(`Success! Found ${data.length} records with Range.`);
  }
}

testILike();
testGteLte();
