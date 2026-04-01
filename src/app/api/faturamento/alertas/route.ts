import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { FaturamentoAlertEngine } from '@/lib/faturamento-alertas';

export const dynamic = 'force-dynamic';

/**
 * API de Alertas de Faturamento (MVP)
 * Permite listar e disparar re-avaliações de saúde da meta
 */
export const GET = withAudit(async (req, session) => {
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);

  const operacaoId = searchParams.get('operacao_id');
  const mode = searchParams.get('mode') || 'list'; // 'list' | 'trigger' | 'history'
  const alertaId = searchParams.get('alerta_id');

  if (mode === 'history' && alertaId) {
    const { data: history, error: errHist } = await supabase
      .from('faturamento_alertas_feedback')
      .select(`
        *,
        usuario:usuarios(nome)
      `)
      .eq('alerta_id', alertaId)
      .order('criado_at', { ascending: false });

    if (errHist) {
      console.error('Erro ao buscar histórico:', errHist);
      // Fallback caso o join falhe (falta de FK)
      const { data: simpleHistory } = await supabase
        .from('faturamento_alertas_feedback')
        .select('*')
        .eq('alerta_id', alertaId)
        .order('criado_at', { ascending: false });
      
      return NextResponse.json(simpleHistory || []);
    }
    return NextResponse.json(history || []);
  }

  // DESATIVADO: REAL-TIME AUTO-TRIGGER: Não rodamos mais o motor na abertura da tela por performance.
  // Em vez disso, a tela lerá os alertas já processados pelo Job periódio (src/app/api/faturamento/alertas/processar/route.ts)
  
  if (mode === 'status') {
    const { data: status } = await supabase
      .from('faturamento_alertas_v2_status')
      .select('*')
      .order('ultima_execucao', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json(status || { ultima_execucao: null, status_execucao: 'pendente' });
  }

  if (mode === 'trigger' && operacaoId) {
    const engine = new FaturamentoAlertEngine();
    const { 
      start: dIniParam = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      end: dFimParam = new Date().toISOString().split('T')[0]
    } = Object.fromEntries(searchParams.entries());
    
    await engine.avaliarPeriodo(operacaoId, dIniParam, dFimParam);
    return NextResponse.json({ success: true });
  }

  // Modo: listagem de alertas filtrados por operação
  let query = supabase.from('faturamento_alertas').select(`
    *,
    regra:faturamento_regras_alerta(*),
    operacao:operacoes!operacao_id(id, nome_operacao, bandeira)
  `).order('data_referencia', { ascending: false });

  const status = searchParams.get('status');
  const severidade = searchParams.get('severidade');

  if (operacaoId) query = query.eq('operacao_id', operacaoId);
  if (status) query = query.eq('status', status);
  if (severidade) query = query.eq('severidade', severidade);

  const { data: rawAlertas, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!rawAlertas || rawAlertas.length === 0) return NextResponse.json([]);

  // Filtragem Auditoria Sênior (User Request): 
  // Retornar apenas alertas de operações que tenham meta cadastrada (ativa) no mês/ano do alerta.
  
  // 1. Mapear operações únicas presentes nos alertas para otimizar busca de metas
  const uniqueOps = Array.from(new Set(rawAlertas.map(a => a.operacao_id)));
  
  // 2. Buscar todas as metas ativas para estas operações (sem filtro de mês/ano aqui para reduzir round-trips)
  const { data: allMetas } = await supabase
    .from('metas_faturamento')
    .select('operacao_id, ano, mes')
    .in('operacao_id', uniqueOps)
    .eq('status', 'ativa');

  // Criar um Set de chaves "op|ano|mes" para busca O(1)
  const metaKeys = new Set(allMetas?.map(m => `${m.operacao_id}|${m.ano}|${m.mes}`) || []);

  // 3. Filtrar a lista de alertas
  const filteredAlertas = rawAlertas.filter(a => {
    if (!a.data_referencia) return false;
    // Extrair ano/mês diretamente da string YYYY-MM-DD para evitar problemas de timezone de Date
    const [y, m] = a.data_referencia.split('-').map(Number);
    return metaKeys.has(`${a.operacao_id}|${y}|${m}`);
  });
  
  return NextResponse.json(filteredAlertas);
});

/**
 * Tratativa de Alertas (Justificativa, Descarte, Auditoria)
 */
export const POST = withAudit(async (req, session) => {
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);
  const body = await req.json();

  const { alerta_id, acao, comentario } = body;

  if (!alerta_id || !acao) {
    return NextResponse.json({ error: 'Faltam parâmetros obrigatórios' }, { status: 400 });
  }

  // 1. Atualizar Status e Responsável do Alerta
  const updateData: any = {
    status: acao,
    atualizado_at: new Date().toISOString()
  };

  // Sempre salva a justificativa se for enviada no payload (mesmo que seja string vazia para limpar)
  if (comentario !== undefined) {
    updateData.justificativa = comentario;
  }
  
  if (body.analista_responsavel_id) {
    updateData.analista_responsavel_id = body.analista_responsavel_id;
  }

  const { error: errUpdate } = await supabase.from('faturamento_alertas')
    .update(updateData)
    .eq('id', alerta_id);

  if (errUpdate) return NextResponse.json({ error: errUpdate.message }, { status: 500 });

  // 2. Registrar no Histórico
  const { error: errHist } = await supabase.from('faturamento_alertas_feedback').insert({
    alerta_id,
    usuario_id: userId,
    acao,
    comentario: body.comentario_adicional || comentario
  });

  if (errHist) {
    console.error('Erro ao salvar feedback:', errHist);
    // Mesmo com erro no histórico, o alerta principal foi atualizado. 
    // Reportamos erro para diagnóstico.
    return NextResponse.json({ error: 'Erro ao registrar histórico: ' + errHist.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

/**
 * Edição de Comentário/Parecer no Histórico
 */
export const PATCH = withAudit(async (req, session) => {
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);
  const body = await req.json();
  const { feedback_id, comentario } = body;

  if (!feedback_id || !comentario) {
    return NextResponse.json({ error: 'Faltam parâmetros' }, { status: 400 });
  }

  // Só permite editar feedbacks do próprio usuário
  const { error } = await supabase
    .from('faturamento_alertas_feedback')
    .update({ comentario, atualizado_at: new Date().toISOString() })
    .eq('id', feedback_id)
    .eq('usuario_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
});

/**
 * Exclusão de Item do Histórico (Feedback)
 */
export const DELETE = withAudit(async (req, session) => {
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);
  const feedbackId = searchParams.get('feedback_id');

  if (!feedbackId) {
    return NextResponse.json({ error: 'feedback_id obrigatório' }, { status: 400 });
  }

  // Só permite excluir feedbacks do próprio usuário
  const { error } = await supabase
    .from('faturamento_alertas_feedback')
    .delete()
    .eq('id', feedbackId)
    .eq('usuario_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
});
