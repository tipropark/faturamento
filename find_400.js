const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findThat400() {
  const { data: movs } = await supabase
    .from('faturamento_movimentos')
    .select('*')
    .eq('operacao_id', 'e2cb938f-5578-4fca-b905-d9a844f3ca5b')
    .ilike('tipo_movimento', '%mensalista%')
    .eq('valor', 400)
    .order('criado_em', { ascending: false })
    .limit(5);
  
  console.log('Those 400 mensalistas:', movs.map(m => ({
     id: m.id,
     saida: m.data_saida,
     entrada: m.data_entrada,
     criado: m.criado_em,
     desc: m.descricao
  })));
}

findThat400();
