
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findThe1348() {
  try {
    const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
    const { data: movs } = await supabase
      .from('faturamento_movimentos')
      .select('*')
      .eq('operacao_id', opId)
      .order('criado_em', { ascending: false })
      .limit(200);

    // Agrupar por data_saida e criado_em
    const sumsSaida = {};
    const sumsCriado = {};

    movs.forEach(m => {
       const ds = (m.data_saida || 'null').substring(0, 10);
       const dc = (m.criado_em || 'null').substring(0, 10);
       sumsSaida[ds] = (sumsSaida[ds] || 0) + Number(m.valor);
       sumsCriado[dc] = (sumsCriado[dc] || 0) + Number(m.valor);
    });

    console.log('Sums by data_saida:', sumsSaida);
    console.log('Sums by criado_em:', sumsCriado);

    // Look for records where sum is 1348
    // Actually, maybe I should check the last 2 days of records
    console.log('Recent Cais records:', movs.slice(0, 5).map(m => ({
       tipo: m.tipo_movimento,
       saida: m.data_saida,
       criado: m.criado_em,
       valor: m.valor
    })));

  } catch (e) { console.error(e); }
}

findThe1348();
