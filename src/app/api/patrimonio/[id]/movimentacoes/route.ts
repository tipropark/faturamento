import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { canAccessPatrimonio, canManagePatrimonio } from '@/lib/permissions';

export const GET = withAudit(async (req, session, { params }) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const id = params.id;
  
  if (!canAccessPatrimonio(perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('patrimonio_movimentacoes')
    .select(`
      *,
      operacao_origem:operacoes!operacao_origem_id(id, nome_operacao),
      operacao_destino:operacoes!operacao_destino_id(id, nome_operacao),
      usuario:usuarios!usuario_id(id, nome)
    `)
    .eq('patrimonio_id', id)
    .order('data_movimentacao', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session, { params }) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const id = params.id;

  if (!canManagePatrimonio(perfil)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const body = await req.json(); // { operacao_destino_id, responsavel_id, motivo }
  const supabase = await getAuditedClient(userId);

  const { data: patrimonio } = await supabase
    .from('patrimonios')
    .select('operacao_id, responsavel_id')
    .eq('id', id)
    .single();

  if (!patrimonio) return NextResponse.json({ error: 'Patrimônio não encontrado' }, { status: 404 });

  // 1. Atualizar o patrimônio para a nova operação/responsável
  const { error: updateError } = await supabase
    .from('patrimonios')
    .update({ 
      operacao_id: body.operacao_destino_id,
      responsavel_id: body.responsavel_id || null,
      status: body.operacao_destino_id === '00000000-0000-0000-0000-000000000000' ? 'Estoque' : 'Ativo' // Exemplo se houver ID fixo pra sede
    })
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // 2. Registrar na timeline de movimentações
  const { data, error } = await supabase
    .from('patrimonio_movimentacoes')
    .insert({
      patrimonio_id: id,
      operacao_origem_id: patrimonio.operacao_id,
      operacao_destino_id: body.operacao_destino_id,
      usuario_id: userId,
      motivo: body.motivo
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
});
