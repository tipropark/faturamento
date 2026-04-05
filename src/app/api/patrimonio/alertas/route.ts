import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { canAccessPatrimonio } from '@/lib/permissions';

export const GET = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  
  if (!canAccessPatrimonio(perfil)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);

  let query = supabase
    .from('patrimonio_alertas')
    .select(`
      *,
      patrimonio:patrimonios!patrimonio_id(
        id, codigo_patrimonio, nome, 
        operacao:operacoes!operacao_id(id, nome_operacao)
      )
    `)
    .eq('status', 'Pendente')
    .order('data_alerta', { ascending: true });

  // Escopo por perfil (mesma lógica do listar patrimonios)
  if (perfil === 'supervisor') {
    const { data: ops } = await supabase.from('operacoes').select('id').eq('supervisor_id', userId);
    const opIds = ops?.map(o => o.id) || [];
    query = query.in('patrimonio.operacao_id', opIds);
  } else if (perfil === 'gerente_operacoes') {
    const { data: ops } = await supabase.from('operacoes').select('id').eq('gerente_operacoes_id', userId);
    const opIds = ops?.map(o => o.id) || [];
    query = query.in('patrimonio.operacao_id', opIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const PATCH = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;

  if (!canAccessPatrimonio(perfil)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
  }

  const body = await req.json(); // { id, status, descricao_resolucao }
  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('patrimonio_alertas')
    .update({
      status: body.status || 'Resolvido',
      descricao: body.descricao_resolucao || body.descricao,
      resolvido_em: new Date().toISOString(),
      resolvido_por_id: userId
    })
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
});
