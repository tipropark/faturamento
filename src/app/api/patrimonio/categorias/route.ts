import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { canAccessPatrimonio, canManagePatrimonio } from '@/lib/permissions';

export const GET = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  
  if (!canAccessPatrimonio(perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);
  const apenasAtivos = searchParams.get('apenasAtivos') === 'true';

  let query = supabase
    .from('patrimonio_categorias')
    .select('*')
    .order('nome', { ascending: true });

  if (apenasAtivos) {
    query = query.eq('ativo', true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;

  if (!canManagePatrimonio(perfil)) {
    return NextResponse.json({ error: 'Permissões insuficientes' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.nome) {
    return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
  }

  const supabase = await getAuditedClient(userId);
  const { data, error } = await supabase
    .from('patrimonio_categorias')
    .insert({ nome: body.nome, ativo: body.ativo ?? true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});
