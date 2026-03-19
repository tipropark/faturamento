
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCaisYesterday() {
  try {
    const opId = 'e2cb938f-5578-4fca-b905-d9a844f3ca5b';
    const { data: movs } = await supabase
      .from('faturamento_movimentos')
      .select('tipo_movimento, criado_em, data_saida, valor')
      .eq('operacao_id', opId)
      .limit(2000);

    const yesterday = '2026-03-17';
    
    const bySaida = movs.filter(m => (m.data_saida || '').startsWith(yesterday)).reduce((s, m) => s + Number(m.valor), 0);
    const byCriado = movs.filter(m => (m.criado_em || '').startsWith(yesterday)).reduce((s, m) => s + Number(m.valor), 0);

    const hybrid = movs.filter(m => {
       const d = (m.tipo_movimento || '').toLowerCase().includes('mensalista') 
          ? (m.criado_em || '').split('T')[0]
          : (m.data_saida || m.criado_em || '').split('T')[0];
       return d === yesterday;
    }).reduce((s, m) => s + Number(m.valor), 0);

    console.log(`Yesterday (data_saida): R$ ${bySaida}`);
    console.log(`Yesterday (criado_em): R$ ${byCriado}`);
    console.log(`Yesterday (Hybrid: Mensalista->Criado, else->Saida): R$ ${hybrid}`);

  } catch (e) { console.error(e); }
}

checkCaisYesterday();
