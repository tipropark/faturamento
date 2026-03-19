const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllDataAPI() {
  const dataLimiteBuffer = new Date();
  dataLimiteBuffer.setDate(dataLimiteBuffer.getDate() - 3);
  const isoLimiteBuffer = dataLimiteBuffer.toISOString();

  const { data: movimentos } = await supabase
    .from('faturamento_movimentos')
    .select('operacao_id, valor, tipo_movimento, forma_pagamento, descricao, criado_em, data_saida, data_entrada')
    .or(`data_saida.gte.${isoLimiteBuffer},data_entrada.gte.${isoLimiteBuffer},criado_em.gte.${isoLimiteBuffer}`)
    .order('criado_em', { ascending: false })
    .limit(20000);

  const opCais = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
  const movCais = movimentos.filter(m => m.operacao_id === opCais);

  console.log(`Out of 20000 rows, Cais has ${movCais.length} rows.`);

  // Calculate sum for Today using COALESCE logic
  const todayStr = '2026-03-18';
  const movsToday = movCais.filter(m => {
        let eff = m.data_saida || m.data_entrada || m.criado_em || '';
        return eff.substring(0, 10) === todayStr;
  });

  const sumToday = movsToday.reduce((acc, m) => acc + (m.tipo_movimento === 'Despesa' ? -Number(m.valor) : Number(m.valor)), 0);
  console.log(`Sum of Today Cais from top 20000: R$ ${sumToday}`);
}

testAllDataAPI();
