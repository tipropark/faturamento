import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const deptoId = searchParams.get('deptoId');
  const catId = searchParams.get('catId');
  const statusId = searchParams.get('statusId');
  const solicitanteId = searchParams.get('solicitanteId');
  const search = searchParams.get('search');

  const supabase = await createClient();

  let query = supabase
    .from('central_solicitacoes')
    .select(`
      *,
      departamento:central_departamentos(nome, cor),
      categoria:central_categorias(nome),
      subcategoria:central_subcategorias(nome),
      solicitante:usuarios!central_solicitacoes_solicitante_id_fkey(nome, email),
      responsavel:usuarios!central_solicitacoes_responsavel_id_fkey(nome, email),
      status:central_status(nome, slug, cor),
      prioridade:central_prioridades(nome, slug, cor),
      operacao:operacoes(nome_operacao)
    `)
    .order('criado_em', { ascending: false });

  if (deptoId) query = query.eq('departamento_id', deptoId);
  if (catId) query = query.eq('categoria_id', catId);
  if (statusId) query = query.eq('status_id', statusId);
  if (solicitanteId) query = query.eq('solicitante_id', solicitanteId);
  if (search) query = query.ilike('titulo', `%${search}%`);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, total: count });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json();
  const { 
    titulo, 
    descricao, 
    departamento_id, 
    categoria_id, 
    subcategoria_id, 
    operacao_id, 
    prioridade_id,
    dynamicFields
  } = body;

  const supabase = await createClient();

  // 1. Buscar status inicial "Novo"
  const { data: statusNovo, error: statusError } = await supabase
    .from('central_status')
    .select('id')
    .eq('slug', 'novo')
    .single();

  if (statusError || !statusNovo) {
    return NextResponse.json({ error: 'Status "Novo" não configurado' }, { status: 500 });
  }

  // 2. Criar Solicitação
  const { data: solicitacao, error: createError } = await supabase
    .from('central_solicitacoes')
    .insert({
      titulo,
      descricao,
      departamento_id,
      categoria_id,
      subcategoria_id: subcategoria_id || null,
      solicitante_id: session.user.id,
      operacao_id: operacao_id || null,
      status_id: statusNovo.id,
      prioridade_id,
      data_abertura: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

  // 3. Salvar Campos Dinâmicos (se houver)
  if (dynamicFields && Object.keys(dynamicFields).length > 0) {
    const values = Object.entries(dynamicFields).map(([campoId, valor]) => ({
      solicitacao_id: solicitacao.id,
      campo_id: campoId,
      valor: typeof valor === 'string' ? valor : JSON.stringify(valor)
    }));
    
    await supabase.from('central_campos_valores').insert(values);
  }

  // 4. Log Interação Inicial
  await supabase.from('central_interacoes').insert({
    solicitacao_id: solicitacao.id,
    usuario_id: session.user.id,
    tipo: 'system_log',
    conteudo: `Solicitação criada por ${session.user.name}. Protocolo: ${solicitacao.protocolo}`
  });

  // 5. Auditoria
  await logAudit({
    usuario_id: session.user.id,
    acao: 'central_solicitacao_criacao',
    descricao: `Criou solicitação: ${solicitacao.protocolo}`,
    tabela: 'central_solicitacoes',
    registro_id: solicitacao.id
  });

  return NextResponse.json(solicitacao);
}
