
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMensalistaDate() {
  try {
    const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
    const { data: movs } = await supabase
       .from('faturamento_movimentos')
       .select('*')
       .eq('operacao_id', opId)
       .eq('valor', 400);

    console.log('Mensalista 400 records:', movs.map(m => ({
       tipo: m.tipo_movimento,
       saida: m.data_saida,
       criado: m.criado_em
    })));

  } catch (e) { console.error(e); }
}

checkMensalistaDate();
