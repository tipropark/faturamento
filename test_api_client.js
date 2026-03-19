const http = require('http');

http.get('http://localhost:3000/api/faturamento?mode=all_data', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const opCais = json.operacoes.find(o => o.nome_operacao && o.nome_operacao.toLowerCase().includes('cais'));
    if (!opCais) { console.log('Cais not found'); return; }
    
    const movsCais = json.movimentos.filter(m => m.operacao_id === opCais.id);
    const resCais = json.resumos.filter(r => r.operacao_id === opCais.id);

    console.log(`Cais Movimentos: ${movsCais.length}`);
    
    // Simulate frontend logic
    const todayStr = '2026-03-18';
    const movsToday = movsCais.filter(m => {
        const sISO = m.data_saida || '';
        const cISO = m.criado_em || '';
        const sDate = sISO.substring(0, 10);
        const cDate = cISO.substring(0, 10);
        if (!sISO) return cDate === todayStr;
        const diffDays = (new Date(cISO).getTime() - new Date(sISO).getTime()) / 86400000;
        const effectiveDate = diffDays > 2 ? cDate : sDate;
        return effectiveDate === todayStr;
    });

    const sumToday = movsToday.reduce((s, m) => s + (m.tipo_movimento === 'Despesa' ? -Number(m.valor) : Number(m.valor)), 0);
    console.log(`Simulated Frontend Today Total for Cais: R$ ${sumToday}`);
    console.log(`- How many matched? ${movsToday.length}`);
    
    const movsYest = movsCais.filter(m => {
        const sISO = m.data_saida || '';
        const cISO = m.criado_em || '';
        const sDate = sISO.substring(0, 10);
        const cDate = cISO.substring(0, 10);
        if (!sISO) return cDate === '2026-03-17';
        const diffDays = (new Date(cISO).getTime() - new Date(sISO).getTime()) / 86400000;
        const effectiveDate = diffDays > 2 ? cDate : sDate;
        return effectiveDate === '2026-03-17';
    });
    const sumYest = movsYest.reduce((s, m) => s + (m.tipo_movimento === 'Despesa' ? -Number(m.valor) : Number(m.valor)), 0);
    console.log(`Simulated Frontend Yesterday Total for Cais: R$ ${sumYest}`);
    console.log(`- How many matched? ${movsYest.length}`);

  });
});
