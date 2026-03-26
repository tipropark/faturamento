import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const opId = '2a6ba4bb-d439-4aef-94d5-f53fdaece039';
  
  console.log(`--- ANALISE DE DADOS REAIS: ASSAI PORTUGAL ---`);
  
  const { data: movs, error } = await supabase
    .from('faturamento_movimentos')
    .select('ticket_id, data_saida, valor, tipo_movimento, forma_pagamento')
    .eq('operacao_id', opId)
    .order('data_saida', { ascending: false })
    .limit(5);
    
  if (error) console.error(error);
  else console.log("Amostra Movimentos:", JSON.stringify(movs, null, 2));

  // Checar totais brutos no banco
  const { data: totals } = await supabase
    .from('faturamento_movimentos')
    .select('valor.sum(), id.count()')
    .eq('operacao_id', opId);
    
  console.log("Totais Absolutos no Banco:", JSON.stringify(totals, null, 2));
}

check();
