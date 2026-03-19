
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatesDistribution() {
  try {
    const { data: movs } = await supabase
      .from('faturamento_movimentos')
      .select('tipo_movimento, criado_em, data_saida')
      .limit(5000);

    const counts = movs.reduce((acc, m) => {
      const creDate = m.criado_em ? m.criado_em.split('T')[0] : 'None';
      const saiDate = m.data_saida ? m.data_saida.split('T')[0] : 'None';
      acc[creDate] = acc[creDate] || { cre: 0, sai: {} };
      acc[creDate].cre++;
      acc[creDate].sai[saiDate] = (acc[creDate].sai[saiDate] || 0) + 1;
      return acc;
    }, {});

    console.log('Date mapping distribution (Criado em -> Data Saída):', JSON.stringify(counts, null, 2));

  } catch (e) {
    console.error(e);
  }
}

checkDatesDistribution();
