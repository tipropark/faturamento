import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('central_solicitacoes')
    .select(`
      *,
      departamento:central_departamentos(*),
      categoria:central_categorias(*),
      subcategoria:central_subcategorias(*),
      solicitante:usuarios!central_solicitacoes_solicitante_id_fkey(nome, email, perfil),
      responsavel:usuarios!central_solicitacoes_responsavel_id_fkey(nome, email, perfil),
      status:central_status(*),
      prioridade:central_prioridades(*),
      operacao:operacoes(id, nome_operacao),
      campos_personalizados:central_campos_valores(
        valor,
        campo:central_campos_dinamicos(label, tipo)
      )
    `)
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json();
  const { status_id, responsavel_id, nota_avaliacao, comentario_avaliacao } = body;

  const supabase = await createClient();

  // Buscar dados atuais para log
  const { data: current } = await supabase
    .from('central_solicitacoes')
    .select('status_id, responsavel_id, protocolo')
    .eq('id', params.id)
    .single();

  const { data, error } = await supabase
    .from('central_solicitacoes')
    .update({
      status_id: status_id || undefined,
      responsavel_id: responsavel_id || undefined,
      nota_avaliacao: nota_avaliacao || undefined,
      comentario_avaliacao: comentario_avaliacao || undefined,
      data_conclusao: status_id ? (await isFinalStatus(status_id, supabase)) ? new Date().toISOString() : undefined : undefined,
      atualizado_em: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log Interação se status mudou
  if (status_id && status_id !== current.status_id) {
    const { data: statusObj } = await supabase.from('central_status').select('nome').eq('id', status_id).single();
    await supabase.from('central_interacoes').insert({
      solicitacao_id: params.id,
      usuario_id: session.user.id,
      tipo: 'status_change',
      conteudo: `Status alterado para "${statusObj?.nome}"`
    });
  }

  // Log Interação se responsável mudou
  if (responsavel_id && responsavel_id !== current.responsavel_id) {
    const { data: userObj } = await supabase.from('usuarios').select('nome').eq('id', responsavel_id).single();
    await supabase.from('central_interacoes').insert({
      solicitacao_id: params.id,
      usuario_id: session.user.id,
      tipo: 'responsible_change',
      conteudo: `Responsável alterado para "${userObj?.nome}"`
    });
  }

  // Auditoria
  await logAudit({
    usuario_id: session.user.id,
    acao: 'central_solicitacao_atualizada',
    descricao: `Atualizou solicitação ${current.protocolo}`,
    tabela: 'central_solicitacoes',
    registro_id: params.id
  });

  return NextResponse.json(data);
}

async function isFinalStatus(statusId: string, supabase: any) {
  const { data } = await supabase.from('central_status').select('finaliza_solicitacao').eq('id', statusId).single();
  return data?.finaliza_solicitacao || false;
}
