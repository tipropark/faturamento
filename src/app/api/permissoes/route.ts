import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit, recordAuditLog } from '@/lib/audit';

export const GET = withAudit(async (req, session) => {
  if (!['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const perfil = searchParams.get('perfil');

  const supabase = await getAuditedClient(session.user.id);
  let query = supabase.from('perfis_permissoes').select('*');
  if (perfil && perfil !== 'all') query = query.eq('perfil', perfil);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session) => {
  if (!['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const { perfil, permissoes } = await req.json();
  const userId = session.user.id;
  const supabase = await getAuditedClient(userId);

  const entries = Object.entries(permissoes).map(([modulo, config]: [string, any]) => ({
    perfil,
    modulo,
    nivel: typeof config === 'string' ? config : config.nivel,
    escopo: config.escopo || 'global',
    operacoes_permitidas: config.operacoes_permitidas || null,
    atualizado_por_id: userId,
    atualizado_em: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('perfis_permissoes')
    .upsert(entries, { onConflict: 'perfil,modulo' })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Registro Manual de Intenção (Opcional, mas útil para o Dashboard)
  await recordAuditLog(req, {
    usuarioId: userId,
    modulo: 'permissoes',
    acao: 'update_matrix_intent',
    descricao: `Atualização em massa da matriz de permissões para: ${perfil}`,
    detalhes: { modulos: entries.length },
    criticidade: 'alta'
  });

  return NextResponse.json(data);
});

export const PUT = withAudit(async (req, session) => {
  if (!['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const { perfilOrigem, perfilDestino } = await req.json();
  const userId = session.user.id;
  const supabase = await getAuditedClient(userId);

  const { data: origem, error: errOrigem } = await supabase
    .from('perfis_permissoes')
    .select('modulo, nivel, escopo, operacoes_permitidas')
    .eq('perfil', perfilOrigem);

  if (errOrigem) return NextResponse.json({ error: errOrigem.message }, { status: 500 });
  
  const entries = origem.map(item => ({
    perfil: perfilDestino,
    modulo: item.modulo,
    nivel: item.nivel,
    escopo: item.escopo,
    operacoes_permitidas: item.operacoes_permitidas,
    atualizado_por_id: userId,
    atualizado_em: new Date().toISOString()
  }));

  const { error: errDest } = await supabase
    .from('perfis_permissoes')
    .upsert(entries, { onConflict: 'perfil,modulo' });

  if (errDest) return NextResponse.json({ error: errDest.message }, { status: 500 });

  // Registro Manual de Intenção
  await recordAuditLog(req, {
    usuarioId: userId,
    modulo: 'permissoes',
    acao: 'clone_matrix_intent',
    descricao: `Clonagem de estrutura de acesso comercial: "${perfilOrigem}" -> "${perfilDestino}"`,
    criticidade: 'alta'
  });

  return NextResponse.json({ success: true, count: entries.length });
});
