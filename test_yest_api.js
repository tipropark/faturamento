const http = require('http');

http.get('http://localhost:3000/api/faturamento?mode=all_data', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const op = json.operacoes.find(o => o.nome_operacao && o.nome_operacao.toLowerCase().includes('cais'));
    
    // Simulate calculating the stat the same way the frontend does for Yesterday
    const resMap = {};
    json.resumos.forEach(r => {
      if (!resMap[r.operacao_id]) resMap[r.operacao_id] = {};
      resMap[r.operacao_id][r.data_referencia] = r; // LAST write wins
    });

    const opResumos = json.resumos.filter(r => r.operacao_id === op.id);

    // period = yesterday
    const now = new Date();
    const todayStr = '2026-03-18'; // Assuming tests run on 18th
    const yestStr = '2026-03-17';
    
    // Filtered summaries
    const filteredUnified = [];
    Object.keys(resMap[op.id] || {}).forEach(date => {
       if (date !== todayStr) {
           filteredUnified.push(resMap[op.id][date]);
       }
    });

    const result = filteredUnified.filter(r => r.data_referencia === yestStr);
    
    const stats = result.reduce((acc, r) => {
        acc.revenue += (Number(r.total_receita_ajustada) || 0) + (Number(r.total_avulso_ajustado) || 0) + (Number(r.total_mensalista_ajustado) || 0);
        return acc;
    }, { revenue: 0 });

    console.log(`Cais Resumos Yesterday using resMap: R$ ${stats.revenue}`);

    // If it's NOT resMap, what if getEnrichedFilteredSummaries uses all unified?
    // Wait, the detail view yesterday total:
    const detailYest = filteredUnified.find(r => r.data_referencia === yestStr);
    console.log('Detail Yest summary object:', detailYest);

  });
});
