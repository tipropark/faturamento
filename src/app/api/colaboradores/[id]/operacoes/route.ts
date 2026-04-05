import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { canEditColaboradorOperacoes } from '@/lib/permissions';

export const GET = withAudit(async (req, session, { params }) => {
  const { id } = params;
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('colaboradores_operacoes')
    .select(`
      *,
      operacao:operacoes!operacao_id(id, nome_operacao, cidade, uf, codigo_operacao)
    `)
    .eq('colaborador_id', id)
    .order('data_inicio', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session, { params }) => {
  const { id } = params;
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;

  if (!canEditColaboradorOperacoes(perfil)) {
    return NextResponse.json({ error: 'Permissao insuficiente' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  const { operacao_id, funcao_operacao, responsavel_principal, data_inicio } = body;

  if (!operacao_id) {
    return NextResponse.json({ error: 'Operacao é obrigatória' }, { status: 400 });
  }

  // Verifica se já existe um vínculo ATIVO para o mesmo colaborador na mesma operação
  const { data: existing } = await supabase
    .from('colaboradores_operacoes')
    .select('id')
    .eq('colaborador_id', id)
    .eq('operacao_id', operacao_id)
    .eq('ativo', true)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Este colaborador já possui um vínculo ativo nesta operação' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('colaboradores_operacoes')
    .insert({
      colaborador_id: id,
      operacao_id,
      funcao_operacao: funcao_operacao || null,
      responsavel_principal: responsavel_principal || false,
      data_inicio: data_inicio || new Date().toISOString().split('T')[0],
      ativo: true
    })
    .select()
    .single();

  if (error) {
     return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
});
