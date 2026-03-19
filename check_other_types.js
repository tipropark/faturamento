
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOtherTypes() {
  try {
    const { data: movs } = await supabase
      .from('faturamento_movimentos')
      .select('tipo_movimento')
      .not('tipo_movimento', 'in', '("Receita","Despesa","Avulso","Mensalista")');

    const counts = movs.reduce((acc, m) => {
      acc[m.tipo_movimento] = (acc[m.tipo_movimento] || 0) + 1;
      return acc;
    }, {});

    console.log('Other Types distribution:', counts);

  } catch (e) {
    console.error(e);
  }
}

checkOtherTypes();
