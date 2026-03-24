
const fs = require('fs');
const path = 'c:/VibeCoding/leve-erp/src/app/(dashboard)/admin/faturamento/metas/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const statsBroken = /const stats = React\.useMemo\(\(\) => \{\s+const stats = \(Array\.isArray\(metas\) \? metas : \[\]\)\.reduce/;
const statsClean = 'const stats = React.useMemo(() => {\n    return (Array.isArray(metas) ? metas : []).reduce';

content = content.replace(statsBroken, statsClean);

// Fix the end of the block too if needed, though it looked okay.
// content = content.replace(/\}, \{ totalMeta: 0, totalRealizado: 0, totalEsperado: 0, totalProjetado: 0, missed: 0, onTrack: 0 \}\);`n  \}, \[metas\]\);/, ...);

fs.writeFileSync(path, content);
console.log('Success Stats Clean');
