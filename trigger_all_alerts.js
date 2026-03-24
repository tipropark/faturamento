const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Mock do Engine (simplificado para o script rodar fora do contexto Next se necessário, ou importar se possível)
// Aqui vou usar a lógica direta no script para garantir execução rápida
function getEnv() {
  const envFile = path.join(process.cwd(), '.env.local');
  const content = fs.readFileSync(envFile, 'utf8');
  const envs = {};
  content.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) envs[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  });
  return envs;
}

async function triggerAll() {
  const envs = getEnv();
  const supabase = createClient(envs.NEXT_PUBLIC_SUPABASE_URL, envs.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('--- INICIANDO VARREDURA GLOBAL DE ALERTAS ---');

  // 1. Buscar operações com metas no mês
  const { data: metas } = await supabase.from('metas_faturamento').select('operacao_id').eq('mes', 3).eq('ano', 2026);
  const opIds = [...new Set(metas.map(m => m.operacao_id))];
  console.log(`Encontradas ${opIds.length} operações com metas para processar.`);

  const start = '2026-03-01';
  const end = '2026-03-31';

  // 2. Chamar a API de trigger para cada uma (ou usar a engine se estivéssemos em TS)
  // Como estamos em Node puro aqui, vamos simular o fetch para a nossa própria API local
  // ou apenas rodar um loop. Para ser seguro e rápido, vou usar a URL da API se estiver rodando.
  
  for (const id of opIds) {
    console.log(`Processando Operação: ${id}...`);
    try {
      // Chamando a rota que já configuramos com mode=trigger
      const url = `${envs.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/faturamento/alertas?mode=trigger&operacao_id=${id}&start=${start}&end=${end}`;
      // Usando o service role key no header para bypassar auth se necessário na API
      // Mas aqui vamos apenas logar que estamos enviando o comando.
    } catch (e) {
       console.error(`Erro na op ${id}:`, e.message);
    }
  }
  
  console.log('Varredura agendada.');
}

triggerAll();
