import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { canAccessPatrimonio, canManagePatrimonioMaintenance } from '@/lib/permissions';

export const GET = withAudit(async (req, session, { params }) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const id = params.id;
  
  if (!canAccessPatrimonio(perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('patrimonio_manutencoes')
    .select(`*`)
    .eq('patrimonio_id', id)
    .order('criado_em', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session, { params }) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const id = params.id;

  if (!canManagePatrimonioMaintenance(perfil)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  // 1. Criar registro de manutenção
  const { data, error } = await supabase
    .from('patrimonio_manutencoes')
    .insert({
      patrimonio_id: id,
      ...body
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Se status for 'Em Curso', atualizar o status do patrimônio para 'Manutenção'
  if (body.status === 'Em Curso') {
    await supabase
      .from('patrimonios')
      .update({ status: 'Manutenção' })
      .eq('id', id);
  }

  return NextResponse.json(data, { status: 201 });
});
