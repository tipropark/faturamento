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
  const categoria_id = searchParams.get('categoria_id');

  let query = supabase
    .from('patrimonio_subcategorias')
    .select(`
      *,
      categoria:patrimonio_categorias(id, nome)
    `)
    .order('nome', { ascending: true });

  if (categoria_id) {
    query = query.eq('categoria_id', categoria_id);
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
  if (!body.categoria_id || !body.nome) {
    return NextResponse.json({ error: 'Categoria ID e Nome da subcategoria são obrigatórios' }, { status: 400 });
  }

  const supabase = await getAuditedClient(userId);
  const { data, error } = await supabase
    .from('patrimonio_subcategorias')
    .insert({
      categoria_id: body.categoria_id,
      nome: body.nome,
      ativo: body.ativo ?? true
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});

export const DELETE = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;

  if (!canManagePatrimonio(perfil)) {
    return NextResponse.json({ error: 'Permissões insuficientes' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID da subcategoria é obrigatório' }, { status: 400 });
  }

  const supabase = await getAuditedClient(userId);
  const { error } = await supabase
    .from('patrimonio_subcategorias')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Subcategoria excluída com sucesso' });
});
