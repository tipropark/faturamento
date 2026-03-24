const fs = require('fs');
const path = require('path');

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

async function kickApi() {
  const envs = getEnv();
  const url = `${envs.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/faturamento/alertas?mode=list`;
  
  console.log('--- CHAMANDO API DE AUDITORIA PARA GERAR ALERTAS ---');
  try {
    // Como a API usa o session, vamos tentar chamar via fetch se possível, senão usaremos o script anterior de diagnóstico para ver se funcionou do nada.
    // Mas, via terminal, é melhor apenas ver se os alertas já estão lá agora que o código mudou.
  } catch (e) {
    console.error(e);
  }
}
kickApi();
