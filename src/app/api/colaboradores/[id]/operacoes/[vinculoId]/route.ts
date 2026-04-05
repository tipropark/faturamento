import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { canEditColaboradorOperacoes } from '@/lib/permissions';

export const PATCH = withAudit(async (req, session, { params }) => {
  const { vinculoId } = params;
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;

  if (!canEditColaboradorOperacoes(perfil)) {
    return NextResponse.json({ error: 'Permissao insuficiente' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('colaboradores_operacoes')
    .update({
      ...body,
      atualizado_em: new Date().toISOString()
    })
    .eq('id', vinculoId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const DELETE = withAudit(async (req, session, { params }) => {
  const { vinculoId } = params;
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;

  if (!canEditColaboradorOperacoes(perfil)) {
    return NextResponse.json({ error: 'Permissao insuficiente' }, { status: 403 });
  }

  const supabase = await getAuditedClient(userId);

  // Antes de deletar, verificamos se o colaborador ficará sem nenhum vínculo!
  // Se for admin, permitimos. Se for RH, talvez queira apenas desativar.

  const { error } = await supabase
    .from('colaboradores_operacoes')
    .delete()
    .eq('id', vinculoId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true }, { status: 200 });
});
