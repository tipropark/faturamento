import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ckgqmgclopqomctgvhbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const opId = '2a6ba4bb-d439-4aef-94d5-f53fdaece039';
  
  console.log(`--- DIAGNÓSTICO OPERAÇÃO: ASSAI PORTUGAL ---`);
  
  const { data: op, error: errOp } = await supabase
    .from('operacoes')
    .select('id, nome_operacao, ultima_sincronizacao, ultimo_movimento_em')
    .eq('id', opId)
    .single();
    
  if (errOp) console.error("Erro ao buscar operacao:", errOp);
  else console.log("Dados Operação:", JSON.stringify(op, null, 2));
  
  const { data: logsV2 } = await supabase
    .from('faturamento_importacao_logs')
    .select('*')
    .eq('operacao_id', opId)
    .order('criado_em', { ascending: false })
    .limit(1);
    
  console.log("Último Log API V2:", JSON.stringify(logsV2, null, 2));

  const { data: syncs } = await supabase
    .from('faturamento_sincronizacoes')
    .select('*')
    .eq('operacao_id', opId)
    .order('criado_em', { ascending: false })
    .limit(1);
    
  console.log("Última Sincronização (Trigger):", JSON.stringify(syncs, null, 2));
}

check();
