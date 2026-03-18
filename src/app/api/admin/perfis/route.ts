import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit, recordAuditLog } from '@/lib/audit';

export const GET = withAudit(async (req, session) => {
  if (!['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const supabase = await getAuditedClient(session.user.id);
  const { data, error } = await supabase
    .from('perfis_sistema')
    .select(`
      *,
      usuario_criador:criado_por_id(nome),
      usuario_atualizador:atualizado_por_id(nome)
    `)
    .order('nome', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session) => {
  if (!['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const userId = session.user.id;
  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('perfis_sistema')
    .insert([{
      ...body,
      criado_por_id: userId,
      atualizado_por_id: userId
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Um perfil com este identificador já existe.' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
});

export const PATCH = withAudit(async (req, session) => {
  if (!['administrador', 'ti'].includes((session.user as any).perfil)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  const { id, ...updates } = await req.json();
  const userId = session.user.id;
  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('perfis_sistema')
    .update({
      ...updates,
      atualizado_por_id: userId,
      atualizado_em: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
});
