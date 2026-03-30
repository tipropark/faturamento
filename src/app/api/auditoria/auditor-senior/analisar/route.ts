import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

const ALLOWED_PERFIS = ['administrador', 'ti', 'auditoria'];

// ── Feriados nacionais brasileiros 2024-2026 ───────────────────────────────
const FERIADOS_NACIONAIS = new Set([
  // 2024
  '2024-01-01','2024-02-12','2024-02-13','2024-03-29','2024-04-21',
  '2024-05-01','2024-05-30','2024-09-07','2024-10-12','2024-11-02',
  '2024-11-15','2024-11-20','2024-12-25',
  // 2025
  '2025-01-01','2025-03-03','2025-03-04','2025-04-18','2025-04-21',
  '2025-05-01','2025-06-19','2025-09-07','2025-10-12','2025-11-02',
  '2025-11-15','2025-11-20','2025-12-25',
  // 2026
  '2026-01-01','2026-02-16','2026-02-17','2026-04-03','2026-04-21',
  '2026-05-01','2026-06-04','2026-09-07','2026-10-12','2026-11-02',
  '2026-11-15','2026-11-20','2026-12-25',
]);

function ehFeriado(dateStr: string): boolean {
  return FERIADOS_NACIONAIS.has(dateStr);
}

function diaDaSemana(dateStr: string): number {
  // Usa meio-dia UTC para evitar problemas de fuso
  return new Date(dateStr + 'T12:00:00Z').getUTCDay(); // 0=Dom, 6=Sab
}

function ehDiaUtil(dateStr: string): boolean {
  const dow = diaDaSemana(dateStr);
  return dow >= 1 && dow <= 5 && !ehFeriado(dateStr);
}

const NOME_DIA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ── Helpers ────────────────────────────────────────────────────────────────
function gerarDatasNoPeriodo(inicio: string, fim: string): string[] {
  const datas: string[] = [];
  const cur = new Date(inicio + 'T12:00:00Z');
  const end = new Date(fim + 'T12:00:00Z');
  while (cur <= end) {
    datas.push(cur.toISOString().split('T')[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return datas;
}

function somarCampo(arr: any[], campo: string): number {
  return arr.reduce((s, m) => s + Math.abs(m[campo] ?? 0), 0);
}

export async function POST(req: NextRequest) {
  // ── 1. Autenticação ────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  const perfil = (session.user as any).perfil as string;
  if (!ALLOWED_PERFIS.includes(perfil)) {
    return NextResponse.json({ error: 'Acesso restrito a auditores e administradores.' }, { status: 403 });
  }

  // ── 2. Validação ───────────────────────────────────────────────────────
  let body: { operacao_id?: string; data_inicio?: string; data_fim?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 }); }

  const { operacao_id, data_inicio, data_fim } = body;
  if (!operacao_id || !data_inicio || !data_fim) {
    return NextResponse.json({ error: 'Parâmetros obrigatórios: operacao_id, data_inicio, data_fim.' }, { status: 400 });
  }

  // ── 3. Busca de dados ──────────────────────────────────────────────────
  const supabase = await createAdminClient();

  // Período histórico: 60 dias antes de data_inicio (para baseline)
  const dtHistoricoInicio = new Date(data_inicio + 'T12:00:00Z');
  dtHistoricoInicio.setUTCDate(dtHistoricoInicio.getUTCDate() - 60);
  const historicoInicio = dtHistoricoInicio.toISOString().split('T')[0];

  const [
    { data: operacao, error: errOp },
    { data: movimentosAtual },
    { data: movimentosHistorico },
    { data: metas },
  ] = await Promise.all([
    supabase
      .from('operacoes')
      .select('id, nome_operacao, bandeira, cidade')
      .eq('id', operacao_id)
      .single(),
    supabase
      .from('faturamento_movimentos')
      .select('data_movimento, tipo_movimento, valor, placa, descricao, forma_pagamento')
      .eq('operacao_id', operacao_id)
      .gte('data_movimento', data_inicio)
      .lte('data_movimento', data_fim)
      .order('data_movimento', { ascending: true })
      .limit(2000),
    supabase
      .from('faturamento_movimentos')
      .select('data_movimento, tipo_movimento, valor, forma_pagamento')
      .eq('operacao_id', operacao_id)
      .gte('data_movimento', historicoInicio)
      .lt('data_movimento', data_inicio)
      .order('data_movimento', { ascending: true })
      .limit(5000),
    supabase
      .from('metas_faturamento')
      .select('mes, ano, valor_meta')
      .eq('operacao_id', operacao_id)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })
      .limit(3),
  ]);

  if (errOp || !operacao) {
    return NextResponse.json({ error: 'Operação não encontrada.' }, { status: 404 });
  }

  const movs = movimentosAtual ?? [];
  const hist = movimentosHistorico ?? [];

  // ── 4. Análise histórica por dia da semana ─────────────────────────────
  // Baseline: média de receita por dia da semana (0-6) no período histórico
  const receitaHistPorDow: Record<number, number[]> = { 0:[],1:[],2:[],3:[],4:[],5:[],6:[] };
  const ticketHistPorDow: Record<number, number[]> = { 0:[],1:[],2:[],3:[],4:[],5:[],6:[] };
  const pctDinheiroHist: number[] = [];

  const histPorData = hist.reduce<Record<string, any[]>>((acc, m) => {
    const d = (m.data_movimento ?? '').split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {});

  for (const [data, movsDia] of Object.entries(histPorData)) {
    if (!ehDiaUtil(data)) continue; // baseline só em dias úteis não-feriado
    const dow = diaDaSemana(data);
    const recDia = movsDia
      .filter(m => m.tipo_movimento === 'receita' || (m.valor ?? 0) > 0)
      .reduce((s: number, m: any) => s + Math.abs(m.valor ?? 0), 0);
    const nDia = movsDia.filter(m => m.tipo_movimento === 'receita' || (m.valor ?? 0) > 0).length;
    receitaHistPorDow[dow].push(recDia);
    if (nDia > 0) ticketHistPorDow[dow].push(recDia / nDia);

    const dinheiroHist = movsDia.filter(m => (m.forma_pagamento ?? '').toLowerCase().includes('dinheiro')).length;
    if (nDia > 0) pctDinheiroHist.push(dinheiroHist / nDia);
  }

  const mediaPorDow = (rec: Record<number, number[]>) =>
    Object.fromEntries(Object.entries(rec).map(([k, v]) => [k, v.length ? v.reduce((a,b) => a+b,0)/v.length : null]));

  const mediaReceitaDow = mediaPorDow(receitaHistPorDow);
  const mediaTicketDow = mediaPorDow(ticketHistPorDow);
  const mediaPctDinheiro = pctDinheiroHist.length
    ? pctDinheiroHist.reduce((a,b)=>a+b,0)/pctDinheiroHist.length : null;

  // Meta diária estimada (valor_meta / dias_uteis_do_mes)
  let metaDiariaEstimada: number | null = null;
  if (metas && metas.length > 0) {
    const meta = metas[0];
    const diasUteisNoMes = Array.from({ length: 31 }, (_, i) => {
      const d = `${meta.ano}-${String(meta.mes).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
      return ehDiaUtil(d) ? 1 : 0;
    }).reduce((a,b)=>a+b,0) || 22;
    metaDiariaEstimada = (meta.valor_meta ?? 0) / diasUteisNoMes;
  }

  // ── 5. Detecção de sinais por dia ─────────────────────────────────────
  const todasDatas = gerarDatasNoPeriodo(data_inicio, data_fim);

  const movsPorData = movs.reduce<Record<string, any[]>>((acc, m) => {
    const d = (m.data_movimento ?? '').split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {});

  interface DiaSinais {
    data: string;
    dia_semana: string;
    eh_util: boolean;
    eh_feriado: boolean;
    receita: number;
    despesas: number;
    n_movimentos: number;
    ticket_medio: number;
    pct_dinheiro: number | null;
    media_historica_dow: number | null;
    desvio_meta_pct: number | null;
    sinais: string[];
  }

  const diasAnalisados: DiaSinais[] = [];
  const receitasPorDia: number[] = []; // para detectar queda brusca sequencial

  for (const data of todasDatas) {
    const dow = diaDaSemana(data);
    const util = ehDiaUtil(data);
    const feriado = ehFeriado(data);
    const movsDia = movsPorData[data] ?? [];

    const recsDia = movsDia.filter(m => m.tipo_movimento === 'receita' || (m.valor ?? 0) > 0);
    const despsDia = movsDia.filter(m => m.tipo_movimento === 'despesa' || (m.valor ?? 0) < 0);
    const receita = recsDia.reduce((s, m) => s + Math.abs(m.valor ?? 0), 0);
    const despesas = despsDia.reduce((s, m) => s + Math.abs(m.valor ?? 0), 0);
    const nMov = recsDia.length;
    const ticketMedio = nMov > 0 ? receita / nMov : 0;

    const dinheiroCount = movsDia.filter(m => (m.forma_pagamento ?? '').toLowerCase().includes('dinheiro')).length;
    const pctDinheiro = nMov > 0 ? dinheiroCount / nMov : null;

    const mediaHist = mediaReceitaDow[dow] ?? null;
    const mediaTicket = mediaTicketDow[dow] ?? null;
    const desvioMetaPct = metaDiariaEstimada && util
      ? ((receita - metaDiariaEstimada) / metaDiariaEstimada) * 100
      : null;

    const sinais: string[] = [];

    // ── PRÉ-VERIFICAÇÃO: só gera alertas para dias operacionais ───────────
    // Finais de semana e feriados recebem contexto diferente
    const diasUtilParaAlerta = util; // true = dia útil não-feriado

    // S1: Dia útil operacional com faturamento zerado
    if (diasUtilParaAlerta && receita === 0 && movsDia.length === 0) {
      sinais.push('DIA_UTIL_ZERADO');
    }

    // S2: Faturamento abaixo da meta diária (≥ 20% abaixo)
    if (diasUtilParaAlerta && desvioMetaPct !== null && desvioMetaPct < -20) {
      sinais.push(`ABAIXO_META_${Math.round(Math.abs(desvioMetaPct))}PCT`);
    }

    // S3: Queda brusca em relação ao histórico do mesmo dia da semana (≥ 40% abaixo)
    if (diasUtilParaAlerta && mediaHist && mediaHist > 0 && receita > 0) {
      const desvioHist = ((receita - mediaHist) / mediaHist) * 100;
      if (desvioHist < -40) {
        sinais.push(`QUEDA_BRUSCA_HIST_${Math.round(Math.abs(desvioHist))}PCT`);
      }
    }

    // S4: Recebimento em dinheiro acima da média histórica (≥ 2x)
    if (mediaPctDinheiro !== null && pctDinheiro !== null && pctDinheiro > mediaPctDinheiro * 2 && pctDinheiro > 0.3) {
      sinais.push(`EXCESSO_DINHEIRO_${Math.round(pctDinheiro * 100)}PCT`);
    }

    // S5: Mudança anormal no mix de pagamento — dinheiro abaixo de 5% quando historicamente é > 20%
    if (mediaPctDinheiro !== null && mediaPctDinheiro > 0.2 && pctDinheiro !== null && pctDinheiro < 0.05 && nMov >= 5) {
      sinais.push('MIX_PAGAMENTO_ANOMALO');
    }

    // S6: Volume elevado de despesas em relação à receita (despesas > 60% da receita)
    if (receita > 0 && despesas > receita * 0.6) {
      sinais.push(`DESPESAS_ELEVADAS_${Math.round((despesas/receita)*100)}PCT`);
    }

    // S7: Ticket médio fora do padrão (> 3x ou < 0.25x da média histórica)
    if (diasUtilParaAlerta && mediaTicket && mediaTicket > 0 && ticketMedio > 0) {
      const razaoTicket = ticketMedio / mediaTicket;
      if (razaoTicket > 3) sinais.push(`TICKET_MUITO_ALTO_${Math.round(razaoTicket)}X`);
      else if (razaoTicket < 0.25) sinais.push(`TICKET_MUITO_BAIXO_${Math.round(razaoTicket * 100)}PCT`);
    }

    // S8: Divergência volume × valor (muitos movimentos com valor total baixo)
    // Detecta: nMov alto mas receita muito baixa em relação ao histórico
    if (diasUtilParaAlerta && mediaHist && mediaHist > 0 && nMov > 10 && receita < mediaHist * 0.3) {
      sinais.push('DIVERGENCIA_VOLUME_VALOR');
    }

    receitasPorDia.push(receita);

    diasAnalisados.push({
      data,
      dia_semana: NOME_DIA[dow],
      eh_util: util,
      eh_feriado: feriado,
      receita,
      despesas,
      n_movimentos: nMov,
      ticket_medio: ticketMedio,
      pct_dinheiro: pctDinheiro !== null ? Math.round(pctDinheiro * 100) : null,
      media_historica_dow: mediaHist ? Math.round(mediaHist) : null,
      desvio_meta_pct: desvioMetaPct !== null ? Math.round(desvioMetaPct) : null,
      sinais,
    });
  }

  // S9: Sequência de dias abaixo da meta (3+ dias consecutivos)
  let sequenciaAbaixo = 0;
  for (const dia of diasAnalisados) {
    if (dia.eh_util && dia.desvio_meta_pct !== null && dia.desvio_meta_pct < -15) {
      sequenciaAbaixo++;
      if (sequenciaAbaixo >= 3 && !dia.sinais.includes('SEQUENCIA_ABAIXO_META')) {
        dia.sinais.push('SEQUENCIA_ABAIXO_META');
      }
    } else {
      sequenciaAbaixo = 0;
    }
  }

  // Marcar dias com combinação de múltiplos sinais
  for (const dia of diasAnalisados) {
    if (dia.sinais.length >= 3) {
      dia.sinais.push('MULTIPLOS_SINAIS_SIMULTANEOS');
    }
  }

  // ── 6. Sumário estatístico para a IA ──────────────────────────────────
  const diasUteis = diasAnalisados.filter(d => d.eh_util);
  const diasComAlerta = diasAnalisados.filter(d => d.sinais.length > 0);
  const totalReceitas = diasAnalisados.reduce((s, d) => s + d.receita, 0);
  const totalDespesas = diasAnalisados.reduce((s, d) => s + d.despesas, 0);
  const ticketGlobal = movs.filter(m => (m.valor ?? 0) > 0).length > 0
    ? totalReceitas / movs.filter(m => (m.valor ?? 0) > 0).length
    : 0;

  const sumario = {
    operacao: operacao.nome_operacao,
    bandeira: operacao.bandeira ?? null,
    periodo: `${data_inicio} a ${data_fim}`,
    total_dias_analisados: todasDatas.length,
    total_dias_uteis: diasUteis.length,
    total_movimentos: movs.length,
    total_receitas: Math.round(totalReceitas),
    total_despesas: Math.round(totalDespesas),
    saldo_liquido: Math.round(totalReceitas - totalDespesas),
    ticket_medio_global: Math.round(ticketGlobal),
    meta_diaria_estimada: metaDiariaEstimada ? Math.round(metaDiariaEstimada) : null,
    dias_com_alertas: diasComAlerta.length,
    resumo_sinais: {
      dias_uteis_zerados: diasAnalisados.filter(d => d.sinais.includes('DIA_UTIL_ZERADO')).length,
      dias_abaixo_meta: diasAnalisados.filter(d => d.sinais.some(s => s.startsWith('ABAIXO_META'))).length,
      dias_queda_brusca: diasAnalisados.filter(d => d.sinais.some(s => s.startsWith('QUEDA_BRUSCA'))).length,
      dias_excesso_dinheiro: diasAnalisados.filter(d => d.sinais.some(s => s.startsWith('EXCESSO_DINHEIRO'))).length,
      dias_mix_anomalo: diasAnalisados.filter(d => d.sinais.includes('MIX_PAGAMENTO_ANOMALO')).length,
      dias_despesas_elevadas: diasAnalisados.filter(d => d.sinais.some(s => s.startsWith('DESPESAS_ELEVADAS'))).length,
      dias_ticket_anomalo: diasAnalisados.filter(d => d.sinais.some(s => s.includes('TICKET'))).length,
      dias_divergencia_volume: diasAnalisados.filter(d => d.sinais.includes('DIVERGENCIA_VOLUME_VALOR')).length,
      dias_sequencia_abaixo_meta: diasAnalisados.filter(d => d.sinais.includes('SEQUENCIA_ABAIXO_META')).length,
      dias_multiplos_sinais: diasAnalisados.filter(d => d.sinais.includes('MULTIPLOS_SINAIS_SIMULTANEOS')).length,
    },
    // Apenas dias com alertas para economizar tokens
    dias_alertados: diasComAlerta.map(d => ({
      data: d.data,
      dia_semana: d.dia_semana,
      eh_feriado: d.eh_feriado,
      receita: d.receita,
      n_movimentos: d.n_movimentos,
      ticket_medio: Math.round(d.ticket_medio),
      pct_dinheiro: d.pct_dinheiro,
      media_hist_dow: d.media_historica_dow,
      desvio_meta_pct: d.desvio_meta_pct,
      sinais: d.sinais,
    })),
    contexto_historico: {
      dias_historico_analisados: Object.keys(histPorData).length,
      media_receita_por_dia_semana: Object.fromEntries(
        Object.entries(mediaReceitaDow).map(([k, v]) => [NOME_DIA[Number(k)], v ? Math.round(v) : null])
      ),
      media_pct_dinheiro_historico: mediaPctDinheiro !== null ? Math.round(mediaPctDinheiro * 100) : null,
    },
  };

  // ── 7. Chamada à IA ────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Serviço de IA não configurado. Configure ANTHROPIC_API_KEY no servidor.' }, { status: 503 });
  }

  const prompt = `Você é um auditor financeiro sênior especializado em operações de estacionamento e transporte. Analise os sinais de risco já detectados e gere um laudo de auditoria profissional em português brasileiro.

DADOS DA OPERAÇÃO:
${JSON.stringify(sumario, null, 2)}

LEGENDA DOS SINAIS:
- DIA_UTIL_ZERADO: dia útil com faturamento zero (possível fechamento não autorizado ou fraude)
- ABAIXO_META_XX%: receita abaixo da meta diária estimada em XX%
- QUEDA_BRUSCA_HIST_XX%: queda de XX% em relação à média histórica do mesmo dia da semana
- EXCESSO_DINHEIRO_XX%: recebimento em dinheiro XX% dos pagamentos — muito acima da média histórica
- MIX_PAGAMENTO_ANOMALO: proporção de dinheiro caiu abruptamente (possível supressão de receita)
- DESPESAS_ELEVADAS_XX%: despesas representam XX% da receita no dia
- TICKET_MUITO_ALTO_Xx ou TICKET_MUITO_BAIXO_XX%: ticket médio fora do padrão histórico
- DIVERGENCIA_VOLUME_VALOR: muitos movimentos mas receita total muito abaixo do esperado
- SEQUENCIA_ABAIXO_META: 3 ou mais dias úteis consecutivos abaixo da meta
- MULTIPLOS_SINAIS_SIMULTANEOS: 3 ou mais sinais de risco no mesmo dia (risco elevado de irregularidade)

CONTEXTO:
- Feriados e finais de semana JÁ foram excluídos da maioria dos alertas
- A baseline histórica usa os 60 dias anteriores ao período analisado
- Sazonalidade por dia da semana (Seg-Dom) foi considerada nos desvios históricos

INSTRUÇÕES:
Responda EXCLUSIVAMENTE com um JSON válido neste formato:
{
  "resumo_executivo": "Parágrafo de 3-5 frases descrevendo o cenário geral, padrões de risco e contexto operacional",
  "score_risco": <inteiro 0-100>,
  "nivel_risco": "<baixo|medio|alto|critico>",
  "anomalias": [
    {
      "tipo": "<nome curto>",
      "descricao": "<descrição técnica com datas específicas quando relevante>",
      "impacto": "<estimativa de impacto financeiro ou percentual>",
      "severidade": "<info|alerta|critico>"
    }
  ],
  "metricas": [
    { "label": "<rótulo>", "valor": "<valor formatado em R$ ou %>", "tendencia": "<up|down|neutral>", "cor": "<hex>" }
  ],
  "recomendacoes": ["<ação 1>", "<ação 2>", "<ação 3>", "<ação 4>"],
  "parecer_final": "Parágrafo conclusivo com julgamento fundamentado do auditor"
}

REGRAS DE PONTUAÇÃO:
- 0-20: operação saudável, sem anomalias relevantes
- 21-40: atenção, desvios pontuais e isolados
- 41-60: risco moderado, padrões recorrentes
- 61-80: risco alto, múltiplos sinais ou impacto financeiro relevante
- 81-100: risco crítico, indícios fortes de irregularidade ou fraude
- MULTIPLOS_SINAIS_SIMULTANEOS eleva automaticamente o score em pelo menos 15 pontos
- DIA_UTIL_ZERADO deve ser investigado como prioritário
- Inclua no mínimo 5 métricas relevantes para o período
- Liste TODAS as anomalias identificadas pelos sinais, agrupando por padrão quando repetidas
- Recomendações devem ser específicas e acionáveis`;

  let iaResponse: any;
  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      console.error('[auditor-senior] Anthropic error:', errBody);
      return NextResponse.json({ error: 'Falha ao chamar serviço de IA. Tente novamente.' }, { status: 502 });
    }

    const aiData = await aiRes.json();
    const rawText = aiData?.content?.[0]?.text ?? '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[auditor-senior] IA sem JSON válido:', rawText);
      return NextResponse.json({ error: 'Resposta inválida do modelo de IA.' }, { status: 502 });
    }

    iaResponse = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[auditor-senior] Erro ao processar IA:', err);
    return NextResponse.json({ error: 'Erro ao processar análise da IA.' }, { status: 502 });
  }

  // ── 8. Resposta final ──────────────────────────────────────────────────
  return NextResponse.json({
    ...iaResponse,
    total_movimentos: sumario.total_movimentos,
    valor_total: totalReceitas,
    gerado_em: new Date().toISOString(),
  });
}
