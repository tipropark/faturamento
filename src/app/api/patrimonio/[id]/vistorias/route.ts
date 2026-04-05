import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { canAccessPatrimonio } from '@/lib/permissions';

export const GET = withAudit(async (req, session, { params }) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const id = params.id;
  
  if (!canAccessPatrimonio(perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('patrimonio_vistorias')
    .select(`
      *,
      usuario:usuarios!usuario_id(id, nome)
    `)
    .eq('patrimonio_id', id)
    .order('data_vistoria', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session, { params }) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const id = params.id;

  if (!canAccessPatrimonio(perfil)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('patrimonio_vistorias')
    .insert({
      patrimonio_id: id,
      usuario_id: userId,
      ...body
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
});
