import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

export const GET = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const id = searchParams.get('id');

  let query = supabase
    .from('operacoes')
    .select(`
      *,
      supervisor:usuarios!supervisor_id(id, nome),
      gerente:usuarios!gerente_operacoes_id(id, nome)
    `)
    .order('nome_operacao');

  if (id) {
    const { data, error } = await query.eq('id', id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (status) query = query.eq('status', status);

  if (perfil === 'supervisor') {
    query = query.eq('supervisor_id', userId);
  } else if (perfil === 'gerente_operacoes') {
    query = query.eq('gerente_operacoes_id', userId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  if (!['administrador', 'administrativo', 'diretoria', 'ti'].includes(perfil)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await req.json();
  const supabase = await getAuditedClient(session.user.id);

  let gerente_operacoes_id = body.gerente_operacoes_id || null;
  const supervisor_id = body.supervisor_id || null;
  const query_template_id = body.query_template_id || null;

  if (supervisor_id && !gerente_operacoes_id) {
    const { data: sup } = await supabase
      .from('usuarios')
      .select('gerente_operacoes_id')
      .eq('id', supervisor_id)
      .single();
    if (sup) gerente_operacoes_id = sup.gerente_operacoes_id;
  }

  const { 
    id_legado, automacao_sistema, automacao_arquitetura, 
    habilitar_faturamento, ponto_bat, script_coleta,
    operacoes_automacao, automacao,
    sql_server, sql_database,
    // Remover campos que serão tratados separadamente ou que não pertencem à tabela operacoes
    ...operacaoData 
  } = body;

  const { data, error } = await supabase
    .from('operacoes')
    .insert({ 
      ...operacaoData, 
      supervisor_id,
      gerente_operacoes_id,
      query_template_id,
      habilitar_faturamento,
      automacao_sistema,
      automacao_arquitetura,
      ponto_bat,
      script_coleta,
      sql_server,
      sql_database,
      token_integracao: operacaoData.token_integracao || crypto.randomUUID()
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Criar vínculo de automação
  let automacao_id = null;
  if (automacao_sistema && automacao_sistema !== '') {
    const { data: cat } = await supabase
      .from('automacoes_catalogo')
      .select('id')
      .eq('nome', automacao_sistema)
      .single();
    if (cat) automacao_id = cat.id;
  }

  const { error: autoError } = await supabase
    .from('operacoes_automacao')
    .insert({
      operacao_id: data.id,
      automacao_id,
      arquitetura: automacao_arquitetura || 'x64',
      habilitar_faturamento: !!habilitar_faturamento,
      ponto_bat: ponto_bat || '',
      script_coleta: script_coleta || ''
    });

  if (autoError) {
    console.error('Erro ao criar automação:', autoError);
    // Não retornamos erro aqui para não invalidar a criação da operação, mas registramos
  }

  return NextResponse.json(data, { status: 201 });
});
