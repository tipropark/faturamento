
const fs = require('fs');
const path = 'c:/VibeCoding/leve-erp/src/app/(dashboard)/admin/faturamento/metas/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix problematic strings
content = content.replace(/const queryStr = `mes=\${periodo\.mes}&ano=\${periodo\.ano}&with_diarias=false`;`n  const { data: metasData, mutate: fetchMetas } = useSWR\(`\/api\/metas-faturamento\?\${queryStr}`, fetcher\);`n  const { data: opsData } = useSWR\('\/api\/operacoes', fetcher\);`n  const metas = metasData \|\| \[\];`n  const operacoes = opsData \|\| \[\];/, 
    'const queryStr = `mes=${periodo.mes}&ano=${periodo.ano}&with_diarias=false`;\n  const { data: metasData, mutate: fetchMetas, isValidating: isMetasValidating } = useSWR(`/api/metas-faturamento?${queryStr}`, fetcher);\n  const { data: opsData } = useSWR("/api/operacoes", fetcher);\n  const metas = metasData || [];\n  const operacoes = opsData || [];\n  const isRefreshing = isMetasValidating;\n  const loading = !metasData;');

content = content.replace(/\/\/ --- PERFORMANCE: CÁLCULOS MEMOIZADOS ---`n  const stats = useMemo\(\(\) => \{/,
    '\/\/ --- PERFORMANCE: CÁLCULOS MEMOIZADOS ---\n  const stats = React.useMemo(() => {');

content = content.replace(/\}, \{ totalMeta: 0, totalRealizado: 0, totalEsperado: 0, totalProjetado: 0, missed: 0, onTrack: 0 \}\);`n  \}, \[metas\]\);/,
    '}, { totalMeta: 0, totalRealizado: 0, totalEsperado: 0, totalProjetado: 0, missed: 0, onTrack: 0 });\n  }, [metas]);');

fs.writeFileSync(path, content);
console.log('Success');
