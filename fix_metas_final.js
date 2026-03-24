
const fs = require('fs');
const path = 'c:/VibeCoding/leve-erp/src/app/(dashboard)/admin/faturamento/metas/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');
const seen = new Set();
const newLines = [];

for (const line of lines) {
  const trim = line.trim();
  if (trim.startsWith('const [activeTab, setActiveTab]') || 
      trim.startsWith('const [selectedMetaId, setSelectedMetaId]') ||
      trim.startsWith('const [activeDate, setActiveDate]')) {
    if (seen.has(trim)) {
      console.log('Removing duplicate:', trim);
      continue;
    }
    seen.add(trim);
  }
  newLines.push(line);
}

fs.writeFileSync(path, newLines.join('\n'));
console.log('Success Final Clean');
