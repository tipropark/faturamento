import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { FaturamentoAlertEngine } from '@/lib/faturamento-alertas';

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

  // REAL-TIME AUTO-TRIGGER: Se for listagem geral, roda o motor para todas as operações que têm metas no mês
  if (mode === 'list') {
    const engine = new FaturamentoAlertEngine();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    
    // 1. Buscar quais IDs de operação têm metas neste mês (independente de status para diagnóstico pleno)
    const { data: metasNoMes } = await supabase
      .from('metas_faturamento')
      .select('operacao_id')
      .eq('ano', now.getFullYear())
      .eq('mes', now.getMonth() + 1);

    const opIds = Array.from(new Set(metasNoMes?.map(m => m.operacao_id).filter(Boolean) || []));

    // 2. Disparar Varredura Proativa (Se houver operacaoId fixo, foca nele, se não, faz o varrido geral)
    if (operacaoId) {
       await engine.avaliarPeriodo(operacaoId, startOfMonth, today);
    } else if (opIds.length > 0) {
       // Aumentamos para os últimos 7 dias para pegar a regra de QUEDA_BRUSCA
       const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
       const rangeStart = sevenDaysAgo > startOfMonth ? sevenDaysAgo : startOfMonth;
       
       // Processamento em lote (limitado para performance)
       await Promise.all(opIds.slice(0, 20).map(id => engine.avaliarPeriodo(id, rangeStart, today)));
    }
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
    status: acao, // Agora usamos os novos status passados diretamente
    atualizado_at: new Date().toISOString()
  };

  if (comentario && acao === 'justificado') {
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
