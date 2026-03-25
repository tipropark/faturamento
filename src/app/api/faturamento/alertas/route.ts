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
        usuario:usuarios(id, nome)
      `)
      .eq('alerta_id', alertaId)
      .order('criado_at', { ascending: false });

    if (errHist) return NextResponse.json({ error: errHist.message }, { status: 500 });
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

  const { data: alertas, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(alertas || []);
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

  // 2. Registrar no Histórico (usando a tabela existente de feedback como histórico)
  await supabase.from('faturamento_alertas_feedback').insert({
    alerta_id,
    usuario_id: userId,
    acao,
    comentario: body.comentario_adicional || comentario
  });

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
