const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCais17() {
  const { data: movs } = await supabase
    .from('faturamento_movimentos')
    .select('valor, tipo_movimento, data_saida, data_entrada, criado_em')
    .eq('operacao_id', 'e2cb938f-5578-4fca-b905-d9a844f3ca5b');

  const yest = movs.filter(m => {
     const eff = m.data_saida || m.data_entrada || m.criado_em || '';
     return eff.substring(0, 10) === '2026-03-17';
  });
  
  const mens = yest.filter(m => m.tipo_movimento === 'Mensalista');
  const sumMens = mens.reduce((s, m) => s + Number(m.valor), 0);
  console.log(`Mensalistas for 17/03: COUNT=${mens.length}, SUM=${sumMens}`);

  const avu = yest.filter(m => m.tipo_movimento === 'Avulso');
  const sumAvu = avu.reduce((s, m) => s + Number(m.valor), 0);
  console.log(`Avulsos for 17/03: COUNT=${avu.length}, SUM=${sumAvu}`);
}

checkCais17();
