import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('--- DEBUG METAS ---');
  
  const { data: metas, error: e1 } = await supabase
    .from('metas_faturamento')
    .select('*, operacoes(nome_operacao)');
  
  if (e1) console.error('Erro metas:', e1);
  else console.log('Metas encontradas:', metas?.length, metas);

  const { data: apuracoes, error: e2 } = await supabase
    .from('metas_faturamento_apuracoes')
    .select('*');
    
  console.log('Apurações encontradas:', apuracoes?.length);

  const { data: resumo, error: e3 } = await supabase
    .from('faturamento_resumo_diario')
    .select('count')
    .limit(1);
    
  console.log('Possui faturamento_resumo_diario:', !!resumo);
}

debug();
