import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { canAccessColaboradores, canManageColaboradores } from '@/lib/permissions';

export const GET = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  
  if (!canAccessColaboradores(perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);

  // Filtros
  const status = searchParams.get('status');
  const cargo = searchParams.get('cargo');
  const operacaoId = searchParams.get('operacao_id');
  const q = searchParams.get('q');

  let query = supabase
    .from('colaboradores')
    .select(`
      *,
      usuario:usuarios!usuario_id(id, nome, email, perfil),
      operacoes:colaboradores_operacoes(
        id, operacao_id, funcao_operacao, ativo,
        operacao:operacoes!operacao_id(id, nome_operacao, cidade, uf)
      )
    `)
    .order('nome');

  if (status) query = query.eq('status', status);
  if (cargo) query = query.eq('cargo', cargo);
  if (q) query = query.or(`nome.ilike.%${q}%,cpf.ilike.%${q}%,matricula.ilike.%${q}%`);

  // Se filtrar por operação, precisamos filtrar na tabela relacional ou via subquery
  if (operacaoId) {
    const { data: colabIds } = await supabase
      .from('colaboradores_operacoes')
      .select('colaborador_id')
      .eq('operacao_id', operacaoId)
      .eq('ativo', true);
    
    const ids = colabIds?.map(c => c.colaborador_id) || [];
    query = query.in('id', ids);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;

  if (!canManageColaboradores(perfil)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  // Validação básica
  if (!body.nome || !body.cpf) {
    return NextResponse.json({ error: 'Nome e CPF são obrigatórios' }, { status: 400 });
  }

  // Verificar se o usuário já está vinculado a outro colaborador
  if (body.usuario_id) {
    const { data: existing } = await supabase
      .from('colaboradores')
      .select('id')
      .eq('usuario_id', body.usuario_id)
      .single();
    
    if (existing) {
      return NextResponse.json({ error: 'Este usuário já está vinculado a outro colaborador' }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from('colaboradores')
    .insert({
      nome: body.nome,
      cpf: body.cpf,
      matricula: body.matricula || null,
      email: body.email || null,
      telefone: body.telefone || null,
      cargo: body.cargo || null,
      departamento: body.departamento || null,
      tipo_vinculo: body.tipo_vinculo || 'CLT',
      status: body.status || 'ativo',
      data_admissao: body.data_admissao || new Date().toISOString().split('T')[0],
      usuario_id: body.usuario_id || null,
      observacoes: body.observacoes || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
       return NextResponse.json({ error: 'CPF ou Matrícula já cadastrados' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Se informou operação inicial, cria o vínculo
  if (body.operacao_id) {
    await supabase.from('colaboradores_operacoes').insert({
      colaborador_id: data.id,
      operacao_id: body.operacao_id,
      funcao_operacao: body.cargo || 'Colaborador',
      ativo: true
    });
  }

  return NextResponse.json(data, { status: 201 });
});
