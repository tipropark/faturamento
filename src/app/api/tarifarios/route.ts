import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { Perfil } from '@/types';

export const GET = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil as Perfil;
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);

  let query = supabase
    .from('solicitacoes_tarifario')
    .select(`
      *,
      operacao:operacoes(id, nome_operacao, cidade, uf),
      solicitante:usuarios!solicitante_id(id, nome),
      diretoria:usuarios!diretoria_id(id, nome),
      tecnico_ti:usuarios!tecnico_ti_id(id, nome)
    `)
    .order('criado_em', { ascending: false });

  const status = searchParams.get('status');
  const operacaoId = searchParams.get('operacao_id');
  const tipo = searchParams.get('tipo');
  const solicitanteId = searchParams.get('solicitante_id');
  const dataInicio = searchParams.get('data_inicio');
  const dataFim = searchParams.get('data_fim');

  if (status) query = query.eq('status', status);
  if (operacaoId) query = query.eq('operacao_id', operacaoId);
  if (tipo) query = query.eq('tipo', tipo);
  if (solicitanteId) query = query.eq('solicitante_id', solicitanteId);
  if (dataInicio) query = query.gte('criado_em', dataInicio);
  if (dataFim) query = query.lte('criado_em', dataFim + 'T23:59:59');

  if (perfil === 'supervisor') {
    query = query.eq('solicitante_id', userId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session) => {
  const userId = session.user.id as string;
  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  const { data, error } = await supabase
    .from('solicitacoes_tarifario')
    .insert({
      ...body,
      solicitante_id: userId,
      status: 'pendente',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Registrar histórico operacional específico do módulo
  await supabase.from('tarifarios_historico').insert({
    solicitacao_id: data.id,
    usuario_id: userId,
    acao: 'criacao',
    descricao: 'Solicitação de tarifário/convênio aberta.',
  });

  return NextResponse.json(data, { status: 201 });
});
