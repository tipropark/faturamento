import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltam variaveis de ambiente");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const opId = '2a6ba4bb-d439-4aef-94d5-f53fdaece039';
  
  console.log(`--- DIAGNÓSTICO OPERAÇÃO: ASSAI PORTUGAL ---`);
  
  // 1. Checar a operação
  const { data: op, error: errOp } = await supabase
    .from('operacoes')
    .select('id, nome_operacao, ultima_sincronizacao, ultimo_movimento_em')
    .eq('id', opId)
    .single();
    
  if (errOp) console.error("Erro ao buscar operacao:", errOp);
  else console.log("Dados Operação:", JSON.stringify(op, null, 2));
  
  // 2. Checar logs de importação da V2
  const { data: logsV2 } = await supabase
    .from('faturamento_importacao_logs')
    .select('*')
    .eq('operacao_id', opId)
    .order('criado_em', { ascending: false })
    .limit(1);
    
  console.log("Último Log API V2:", JSON.stringify(logsV2, null, 2));

  // 3. Checar sincronizações (Trigger)
  const { data: syncs } = await supabase
    .from('faturamento_sincronizacoes')
    .select('*')
    .eq('operacao_id', opId)
    .order('criado_em', { ascending: false })
    .limit(1);
    
  console.log("Última Sincronização (Trigger):", JSON.stringify(syncs, null, 2));
}

check();
