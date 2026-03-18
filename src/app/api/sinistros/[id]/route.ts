import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient } from '@/lib/audit';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  const userId = session.user.id as string;

  const supabase = await getAuditedClient(userId);
  const [sinistroRes, anexosRes, historicoRes, inconsistenciasRes] = await Promise.all([
    supabase.from('sinistros').select(`
      *,
      operacao:operacoes!operacao_id(id, nome_operacao, cidade, uf, bandeira),
      supervisor:usuarios!supervisor_id(id, nome, telefone),
      gerente_operacoes:usuarios!gerente_operacoes_id(id, nome),
      criado_por:usuarios!criado_por_id(id, nome),
      analista:usuarios!analista_id(id, nome),
      prevencao_responsavel:usuarios!prevencao_responsavel_id(id, nome)
    `).eq('id', id).single(),
    supabase.from('anexos').select(`
      *, usuario:usuarios!usuario_id(id, nome)
    `).eq('sinistro_id', id).order('criado_em', { ascending: false }),
    supabase.from('historico_sinistros').select(`
      *, usuario:usuarios!usuario_id(id, nome)
    `).eq('sinistro_id', id).order('criado_em', { ascending: false }),
    supabase.from('inconsistencias').select(`
      *, 
      analisado_por:usuarios!analisado_por_id(id, nome),
      criado_por:usuarios!criado_por_id(id, nome)
    `).eq('sinistro_id', id).order('criado_em', { ascending: false }),
  ]);

  if (sinistroRes.error) {
    return NextResponse.json({ error: sinistroRes.error.message }, { status: 404 });
  }

  return NextResponse.json({
    sinistro: sinistroRes.data,
    anexos: anexosRes.data || [],
    historico: historicoRes.data || [],
    inconsistencias: inconsistenciasRes.data || [],
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);

  // Buscar status atual para histórico
  const { data: atual } = await supabase.from('sinistros').select('status').eq('id', id).single();

  const { data, error } = await supabase
    .from('sinistros')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Histórico de mudança de status
  if (atual && body.status && atual.status !== body.status) {
    await supabase.from('historico_sinistros').insert({
      sinistro_id: id,
      usuario_id: userId,
      acao: 'mudanca_status',
      descricao: `Status alterado de "${atual.status}" para "${body.status}"`,
    });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !session.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id as string;
  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  // Buscar dados atuais para comparar e registrar histórico
  const { data: atual } = await supabase.from('sinistros').select('*').eq('id', id).single();
  
  if (!atual) return NextResponse.json({ error: 'Sinistro não encontrado' }, { status: 404 });

  const { data, error } = await supabase
    .from('sinistros')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Registro de histórico inteligente
  const alteracoes = [];

  // 1. Mudança de Status
  if (body.status && atual.status !== body.status) {
    alteracoes.push(`Status alterado para "${body.status}"`);
  }

  // 2. Mudanças em campos de dados
  const camposMonitorados = [
    { key: 'categoria_sinistro', label: 'Categoria' },
    { key: 'motivo_especifico', label: 'Motivo' },
    { key: 'cliente_nome', label: 'Nome do Cliente' },
    { key: 'veiculo_placa', label: 'Placa' },
    { key: 'data_ocorrencia', label: 'Data Ocorrência' },
    { key: 'local_detalhado', label: 'Local da Ocorrência' },
    { key: 'prevencao_melhoria', label: 'Melhoria' },
    { key: 'prevencao_como_evitar', label: 'Como evitar' },
    { key: 'prevencao_status_acao', label: 'Status da Prevenção' },
    { key: 'reducao_valor_original', label: 'Valor Original' },
    { key: 'reducao_valor_negociado', label: 'Valor Negociado' },
  ];

  camposMonitorados.forEach(campo => {
    if (body[campo.key] !== undefined && String(body[campo.key]) !== String(atual[campo.key])) {
      alteracoes.push(`${campo.label} alterado`);
    }
  });

  if (alteracoes.length > 0) {
    await supabase.from('historico_sinistros').insert({
      sinistro_id: id,
      usuario_id: userId,
      acao: body.status && atual.status !== body.status ? 'mudanca_status' : 'edicao',
      descricao: alteracoes.join('; '),
    });
  }

  return NextResponse.json(data);
}
