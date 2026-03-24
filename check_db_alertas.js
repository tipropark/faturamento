const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
  const envFile = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envFile)) return {};
  const content = fs.readFileSync(envFile, 'utf8');
  const envs = {};
  content.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) envs[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  });
  return envs;
}

async function check() {
  const envs = getEnv();
  const url = envs.NEXT_PUBLIC_SUPABASE_URL;
  const key = envs.SUPABASE_SERVICE_ROLE_KEY || envs.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('URL ou KEY não encontradas!');
    return;
  }

  const supabase = createClient(url, key);
  console.log('Using URL:', url);

  try {
    // 1. Regras
    const { data: regras } = await supabase.from('faturamento_regras_alerta').select('*').eq('habilitada', true);
    console.log('Regras ativas:', regras?.length || 0);

    // 2. Metas do Mês
    const { data: metas } = await supabase.from('metas_faturamento').select('id').eq('mes', 3).eq('ano', 2026);
    console.log('Metas em Março/2026:', metas?.length || 0);

    // 3. Resumos do Mês (Faturamento consolidado)
    const { data: resumos } = await supabase.from('faturamento_resumo_diario').select('id').gte('data_referencia', '2026-03-01').lte('data_referencia', '2026-03-31');
    console.log('Faturamentos Diários (Resumos) em Março:', resumos?.length || 0);

    // 4. Alertas gerados
    const { data: alertas } = await supabase.from('faturamento_alertas').select('id');
    console.log('Total de Alertas no Banco:', alertas?.length || 0);

    if (alertas?.length === 0 && resumos?.length > 0 && metas?.length > 0 && regras?.length > 0) {
       console.log('\n--- DIAGNOSTICO ---');
       console.log('Causa Provável: Tem tudo para gerar alertas, mas o motor não rodou.');
    }
  } catch (err) {
    console.error('Erro fatal:', err);
  }
}

check();
