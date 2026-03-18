import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

export const GET = withAudit(async (req, session, context) => {
  const userId = session.user.id as string;
  const { id } = await context.params;
  const supabase = await getAuditedClient(userId);

  // 1. Buscar Meta com Joins
  const { data: meta, error } = await supabase
    .from('metas_faturamento')
    .select(`
      *,
      operacao:operacoes!operacao_id(*),
      apuracao:metas_faturamento_apuracoes!meta_id(*),
      criado_por:usuarios!criado_por_id(id, nome)
    `)
    .eq('id', id)
    .single();

  if (error || !meta) return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });

  // 2. Buscar Apurações Diárias (Evolução)
  const { data: diarias } = await supabase
    .from('metas_faturamento_apuracoes_diarias')
    .select('*')
    .eq('meta_id', id)
    .order('data_referencia', { ascending: true });

  // 3. Buscar Alertas vinculados
  const { data: alertas } = await supabase
    .from('metas_faturamento_alertas')
    .select(`
      *,
      tratativa:metas_faturamento_tratativas!alerta_id(*)
    `)
    .eq('meta_id', id)
    .order('gerado_em', { ascending: false });

  return NextResponse.json({
    ...meta,
    evolucao_diaria: diarias || [],
    alertas: alertas || []
  });
});

export const PUT = withAudit(async (req, session, context) => {
  const userId = session.user.id as string;
  const { id } = await context.params;
  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('metas_faturamento')
    .update({
      ...body,
      atualizado_em: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
});

export const DELETE = withAudit(async (req, session, context) => {
  const userId = session.user.id as string;
  const { id } = await context.params;
  const supabase = await getAuditedClient(userId);

  // Soft delete / Cancelar
  const { data, error } = await supabase
    .from('metas_faturamento')
    .update({ status: 'cancelada', atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
