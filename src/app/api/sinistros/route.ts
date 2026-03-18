import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';
import { gerarProtocolo } from '@/lib/utils';
import { adicionarDiasUteis, estaForaDoPrazoAbertura } from '@/lib/date-utils';

export const GET = withAudit(async (req, session) => {
  const perfil = (session.user as any).perfil;
  const userId = session.user.id as string;
  const supabase = await getAuditedClient(userId);
  const { searchParams } = new URL(req.url);

  let query = supabase
    .from('sinistros')
    .select(`
      id, pr, protocolo, status, prioridade, criado_em,
      cliente_nome, cliente_cpf, cliente_telefone,
      veiculo_placa, veiculo_modelo, veiculo_marca,
      motivo, danos, data_ocorrencia, data_emissao, data_limite_sla,
      categoria_sinistro, motivo_especifico, local_detalhado,
      fora_do_prazo_abertura,
      operacao:operacoes!operacao_id(id, nome_operacao, cidade, uf),
      supervisor:usuarios!supervisor_id(id, nome),
      gerente_operacoes:usuarios!gerente_operacoes_id(id, nome),
      criado_por:usuarios!criado_por_id(id, nome),
      analista:usuarios!analista_id(id, nome)
    `)
    .order('criado_em', { ascending: false });

  const status = searchParams.get('status');
  const operacaoId = searchParams.get('operacao_id');
  const supervisorId = searchParams.get('supervisor_id');
  const pr = searchParams.get('pr');
  const dataInicio = searchParams.get('data_inicio');
  const dataFim = searchParams.get('data_fim');

  if (status) query = query.eq('status', status);
  if (operacaoId) query = query.eq('operacao_id', operacaoId);
  if (supervisorId) query = query.eq('supervisor_id', supervisorId);
  if (pr) query = query.ilike('pr', `%${pr}%`);
  if (dataInicio) query = query.gte('criado_em', dataInicio);
  if (dataFim) query = query.lte('criado_em', dataFim + 'T23:59:59');

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
  const userId = session.user.id as string;
  const body = await req.json();
  const supabase = await getAuditedClient(userId);

  const { data: operacao } = await supabase
    .from('operacoes')
    .select('supervisor_id, gerente_operacoes_id')
    .eq('id', body.operacao_id)
    .single();

  if (!operacao) return NextResponse.json({ error: 'Operação não encontrada' }, { status: 400 });

  const protocolo = gerarProtocolo();
  const dataEmissao = new Date().toISOString().split('T')[0];
  const dataOcorrenciaObj = new Date(body.data_ocorrencia);
  const dataLimiteSla = adicionarDiasUteis(dataOcorrenciaObj, 12).toISOString().split('T')[0];
  const foraDoPrazo = estaForaDoPrazoAbertura(body.data_ocorrencia, dataEmissao);

  const { data, error } = await supabase
    .from('sinistros')
    .insert({
      ...body,
      protocolo,
      data_emissao: dataEmissao,
      data_limite_sla: dataLimiteSla,
      fora_do_prazo_abertura: foraDoPrazo,
      criado_por_id: userId,
      supervisor_id: operacao.supervisor_id,
      gerente_operacoes_id: operacao.gerente_operacoes_id,
      status: 'aberto',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Inconsistência automática se fora do prazo
  if (foraDoPrazo) {
    await supabase.from('inconsistencias').insert({
      sinistro_id: data.id,
      tipo: 'Sinistro fora do prazo',
      descricao: 'A data da ocorrência ultrapassa 48 horas úteis em relação à data de envio do formulário.',
      status: 'pendente'
    });
  }

  // Inconsistência automática por falta de imagens
  if (!body.possui_imagens) {
    await supabase.from('inconsistencias').insert({
      sinistro_id: data.id,
      tipo: 'Ausência de imagens de CFTV',
      descricao: 'O sinistro foi aberto sem anexar imagens de CFTV. Motivo informado: ' + (body.justificativa_ausencia_imagens || 'Não informado'),
      status: 'pendente'
    });
  }

  // Registrar Histórico do Módulo (Operacional)
  await supabase.from('historico_sinistros').insert({
    sinistro_id: data.id,
    usuario_id: userId,
    acao: 'criacao',
    descricao: `Sinistro criado com PR ${data.pr}${foraDoPrazo ? ' (Fora do prazo de abertura)' : ''}`,
  });

  return NextResponse.json(data, { status: 201 });
});
