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

  let query = supabase
    .from('patrimonios')
    .select(`
      *,
      operacao:operacoes!operacao_id(id, nome_operacao, cidade, uf),
      responsavel:colaboradores!responsavel_id(id, nome)
    `)
    .order('criado_em', { ascending: false });

  // Filtros
  const status = searchParams.get('status');
  const categoria = searchParams.get('categoria');
  const operacaoId = searchParams.get('operacao_id');
  const q = searchParams.get('q');

  if (status) query = query.eq('status', status);
  if (categoria) query = query.eq('categoria', categoria);
  if (operacaoId) query = query.eq('operacao_id', operacaoId);
  if (q) query = query.or(`nome.ilike.%${q}%,codigo_patrimonio.ilike.%${q}%`);

  // Escopo por perfil
  if (perfil === 'supervisor') {
    const { data: ops } = await supabase.from('operacoes').select('id').eq('supervisor_id', userId);
    const opIds = ops?.map(o => o.id) || [];
    query = query.in('operacao_id', opIds);
  } else if (perfil === 'gerente_operacoes') {
    const { data: ops } = await supabase.from('operacoes').select('id').eq('gerente_operacoes_id', userId);
    const opIds = ops?.map(o => o.id) || [];
    query = query.in('operacao_id', opIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;

  if (!canManagePatrimonio(perfil)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('patrimonios')
    .insert({
      ...body,
      status: body.status || 'Estoque',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Registro inicial de movimentação
  await supabase.from('patrimonio_movimentacoes').insert({
    patrimonio_id: data.id,
    operacao_destino_id: data.operacao_id,
    usuario_id: userId,
    motivo: 'Cadastro inicial e alocação'
  });

  return NextResponse.json(data, { status: 201 });
});
