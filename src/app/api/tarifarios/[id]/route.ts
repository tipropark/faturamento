import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { Perfil } from '@/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('solicitacoes_tarifario')
    .select(`
      *,
      operacao:operacoes(id, nome_operacao, cidade, uf),
      solicitante:usuarios!solicitante_id(id, nome),
      diretoria:usuarios!diretoria_id(id, nome),
      tecnico_ti:usuarios!tecnico_ti_id(id, nome)
    `)
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id as string;
  const perfil = (session.user as any).perfil as Perfil;
  const body = await req.json();
  const supabase = await createAdminClient();

  // Buscar estado atual
  const { data: current } = await supabase.from('solicitacoes_tarifario').select('*').eq('id', id).single();
  if (!current) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  let updateData: any = {};
  let acaoHist = 'edicao';
  let descHist = 'Solicitação atualizada';

  // Regra de Aprovação (Diretoria)
  if (body.action === 'approve' || body.action === 'reject') {
    if (!['administrador', 'diretoria'].includes(perfil)) {
      return NextResponse.json({ error: 'Sem permissão para aprovar/reprovar' }, { status: 403 });
    }
    updateData = {
      status: body.action === 'approve' ? 'aprovado' : 'reprovado',
      diretoria_id: userId,
      data_parecer: new Date().toISOString(),
      parecer_diretoria: body.parecer
    };
    acaoHist = updateData.status;
    descHist = `${body.action === 'approve' ? 'Aprovada' : 'Reprovada'} por diretoria. Parecer: ${body.parecer || 'Sem observações'}`;
  }

  // Regra de Execução (TI)
  else if (body.action === 'start_execution' || body.action === 'complete') {
    if (!['administrador', 'ti'].includes(perfil)) {
      return NextResponse.json({ error: 'Sem permissão para executar' }, { status: 403 });
    }
    if (body.action === 'start_execution') {
      updateData = {
        status: 'em_execucao',
        tecnico_ti_id: userId,
        data_inicio_execucao: new Date().toISOString(),
      };
      acaoHist = 'inicio_execucao';
      descHist = 'Iniciada execução técnica pelo TI.';
    } else {
      updateData = {
        status: 'concluido',
        data_conclusao: new Date().toISOString(),
        obs_tecnica: body.obs_tecnica
      };
      acaoHist = 'concluido';
      descHist = 'Execução técnica concluída pelo TI.';
    }
  } else {
    // Edição genérica
    updateData = { ...body };
  }

  const { data, error } = await supabase
    .from('solicitacoes_tarifario')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Registrar histórico
  await supabase.from('tarifarios_historico').insert({
    solicitacao_id: id,
    usuario_id: userId,
    acao: acaoHist,
    descricao: descHist,
  });

  return NextResponse.json(data);
}
