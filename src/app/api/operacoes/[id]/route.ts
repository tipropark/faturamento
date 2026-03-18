import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('operacoes')
    .select(`
      *, 
      supervisor:usuarios!supervisor_id(id, nome),
      gerente:usuarios!gerente_operacoes_id(id, nome),
      operacoes_automacao(
        automacao_id,
        arquitetura,
        habilitar_faturamento,
        ponto_bat,
        script_coleta,
        sistema:automacoes_catalogo(nome)
      )
    `)
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const perfil = (session.user as any).perfil;
  if (!['administrador', 'administrativo', 'diretoria'].includes(perfil)) {
    return NextResponse.json({ error: 'Sem permissão para editar operações' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const supabase = await createAdminClient();

  // Atualizar gerente baseado no supervisor
  let gerente_operacoes_id = body.gerente_operacoes_id;
  if (body.supervisor_id) {
    const { data: sup } = await supabase
      .from('usuarios')
      .select('gerente_operacoes_id')
      .eq('id', body.supervisor_id)
      .single();
    if (sup) gerente_operacoes_id = sup.gerente_operacoes_id;
  }

  const { 
    id_legado, automacao_sistema, automacao_arquitetura, 
    habilitar_faturamento, ponto_bat, script_coleta,
    operacoes_automacao, automacao,
    sql_server, sql_database,
    ...operacaoData 
  } = body;

  // Atualizar a tabela principal (mantendo redundância para compatibilidade se existirem as colunas)
  const { data, error } = await supabase
    .from('operacoes')
    .update({ 
      ...operacaoData, 
      gerente_operacoes_id,
      habilitar_faturamento,
      automacao_sistema,
      automacao_arquitetura,
      ponto_bat,
      script_coleta,
      sql_server,
      sql_database
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Buscar ID do sistema no catálogo pelo nome (se fornecido)
  let automacao_id = null;
  if (automacao_sistema && automacao_sistema !== '') {
    const { data: cat } = await supabase
      .from('automacoes_catalogo')
      .select('id')
      .eq('nome', automacao_sistema)
      .single();
    if (cat) automacao_id = cat.id;
  }

  const autoPayload = {
    operacao_id: id,
    automacao_id,
    arquitetura: automacao_arquitetura || 'x64',
    habilitar_faturamento: !!habilitar_faturamento,
    ponto_bat: ponto_bat || '',
    script_coleta: script_coleta || ''
  };

  // Upsert manual robusto na tabela operacoes_automacao
  const { data: existingAuto } = await supabase
    .from('operacoes_automacao')
    .select('id')
    .eq('operacao_id', id)
    .maybeSingle();

  let autoError;
  if (existingAuto) {
    const { error: err } = await supabase
      .from('operacoes_automacao')
      .update(autoPayload)
      .eq('id', existingAuto.id);
    autoError = err;
  } else {
    const { error: err } = await supabase
      .from('operacoes_automacao')
      .insert(autoPayload);
    autoError = err;
  }

  if (autoError) {
    console.error('SERVER ERROR (AutoSave):', autoError);
    return NextResponse.json({ error: 'Erro ao salvar configuração de automação: ' + autoError.message }, { status: 500 });
  }

  // Buscar dados atualizados COMPLETOS (com joins) para o frontend
  const { data: updatedOp, error: fetchError } = await supabase
    .from('operacoes')
    .select(`
      *, 
      supervisor:usuarios!supervisor_id(id, nome),
      gerente:usuarios!gerente_operacoes_id(id, nome),
      operacoes_automacao(
        id,
        automacao_id,
        arquitetura,
        habilitar_faturamento,
        ponto_bat,
        script_coleta,
        sistema:automacoes_catalogo(nome)
      )
    `)
    .eq('id', id)
    .single();

  if (fetchError) console.error('SERVER ERROR (FetchAfterSave):', fetchError);

  return NextResponse.json(updatedOp || data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const perfil = (session.user as any).perfil;
  if (!['administrador', 'administrativo', 'diretoria'].includes(perfil)) {
    return NextResponse.json({ error: 'Sem permissão para inativar operações' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('operacoes')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
