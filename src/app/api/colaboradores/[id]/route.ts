import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { canAccessColaboradores, canManageColaboradores } from '@/lib/permissions';

export const GET = withAudit(async (req, session, { params }) => {
  const { id } = params;
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;

  if (!canAccessColaboradores(perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('colaboradores')
    .select(`
      *,
      usuario:usuarios!usuario_id(id, nome, email, perfil, status, ativo),
      operacoes:colaboradores_operacoes(
        id, operacao_id, funcao_operacao, ativo, responsavel_principal,
        data_inicio, data_fim,
        operacao:operacoes!operacao_id(id, nome_operacao, cidade, uf, codigo_operacao)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
});

export const PATCH = withAudit(async (req, session, { params }) => {
  const { id } = params;
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;

  if (!canManageColaboradores(perfil)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  // Impedir alteração de ID ou CPF (CPF apenas via suporte/admin diretoria se houver erro)
  const updateData: any = { ...body };
  delete updateData.id;
  delete updateData.cpf; 

  const { data, error } = await supabase
    .from('colaboradores')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
       return NextResponse.json({ error: 'Matrícula ou Usuário já vinculado a outro colaborador' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
});
