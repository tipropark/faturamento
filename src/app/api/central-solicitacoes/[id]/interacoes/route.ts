import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('central_interacoes')
    .select(`
      *,
      usuario:usuarios(nome, email, perfil),
      anexos:central_anexos(*)
    `)
    .eq('solicitacao_id', params.id)
    .order('criado_em', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json();
  const { tipo, conteudo, metadados, anexos } = body;

  const supabase = await createClient();

  // 1. Criar Interação
  const { data: interacao, error: interacaoError } = await supabase
    .from('central_interacoes')
    .insert({
      solicitacao_id: params.id,
      usuario_id: session.user.id,
      tipo: tipo || 'mensagem',
      conteudo,
      metadados: metadados || null,
      criado_em: new Date().toISOString()
    })
    .select()
    .single();

  if (interacaoError) return NextResponse.json({ error: interacaoError.message }, { status: 500 });

  // 2. Salvar Anexos (se houver)
  if (anexos && Array.isArray(anexos) && anexos.length > 0) {
    const anexosData = anexos.map(anexo => ({
      solicitacao_id: params.id,
      interacao_id: interacao.id,
      nome_arquivo: anexo.nome_arquivo,
      url: anexo.url,
      tamanho: anexo.tamanho,
      tipo_mime: anexo.tipo_mime,
      usuario_id: session.user.id
    }));
    
    const { error: anexosError } = await supabase.from('central_anexos').insert(anexosData);
    if (anexosError) console.error('Erro ao salvar anexos:', anexosError);
  }

  // 3. Atualizar data_primeira_resposta se for o primeiro atendimento do responsável
  // (opcional: implementar lógica de SLA aqui)

  return NextResponse.json(interacao);
}
