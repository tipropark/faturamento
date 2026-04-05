import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { canAccessPatrimonio, canManagePatrimonio } from '@/lib/permissions';

export const GET = withAudit(async (req, session, context) => {
  const params = await context.params;
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const id = params.id;
  
  if (!canAccessPatrimonio(perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const supabase = await getAuditedClient(userId);

  // 1. Fetch Master Data
  const { data: item, error: itemError } = await supabase
    .from('patrimonios')
    .select(`
      *,
      operacao:operacoes!operacao_id(id, nome_operacao, cidade, uf),
      responsavel:colaboradores!responsavel_id(id, nome)
    `)
    .eq('id', id)
    .single();

  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 500 });
  if (!item) return NextResponse.json({ error: 'Patrimônio não encontrado' }, { status: 404 });

  // 2. Fetch Movimentações
  const { data: movimentacoes } = await supabase
    .from('patrimonio_movimentacoes')
    .select(`
      *,
      origem:operacoes!operacao_origem_id(id, nome_operacao),
      destino:operacoes!operacao_destino_id(id, nome_operacao),
      usuario:usuarios!usuario_id(id, nome)
    `)
    .eq('patrimonio_id', id)
    .order('data_movimentacao', { ascending: false });

  // 3. Fetch Manutenções
  const { data: manutencoes } = await supabase
    .from('patrimonio_manutencoes')
    .select('*')
    .eq('patrimonio_id', id)
    .order('criado_em', { ascending: false });

  // 4. Fetch Vistorias
  const { data: vistorias } = await supabase
    .from('patrimonio_vistorias')
    .select(`
      *,
      usuario:usuarios!usuario_id(id, nome)
    `)
    .eq('patrimonio_id', id)
    .order('data_vistoria', { ascending: false });

  // 5. Fetch Anexos
  const { data: anexos } = await supabase
    .from('patrimonio_anexos')
    .select('*')
    .eq('patrimonio_id', id)
    .order('criado_em', { ascending: false });

  // 6. Consolidate Result
  return NextResponse.json({
    item,
    movimentacoes: movimentacoes || [],
    manutencoes: manutencoes || [],
    vistorias: vistorias || [],
    anexos: anexos || [],
    historico_resumido: [], // Simplified audit trail
    perfilUsuario: perfil // Passing the role to the frontend securely
  });
});

export const PUT = withAudit(async (req, session, context) => {
  const params = await context.params;
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const id = params.id;

  if (!canManagePatrimonio(perfil)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('patrimonios')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const DELETE = withAudit(async (req, session, context) => {
  const params = await context.params;
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const id = params.id;

  if (!canManagePatrimonio(perfil)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);
  const motivo = searchParams.get('motivo') || 'Baixa patrimonial via sistema';

  const { data, error } = await supabase
    .from('patrimonios')
    .update({ 
      status: 'Baixado',
      atualizado_em: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('patrimonio_movimentacoes').insert({
    patrimonio_id: id,
    usuario_id: userId,
    operacao_destino_id: data.operacao_id,
    motivo: `BAIXA: ${motivo}`
  });

  return NextResponse.json({ success: true, message: 'Patrimônio baixado com sucesso' });
});
