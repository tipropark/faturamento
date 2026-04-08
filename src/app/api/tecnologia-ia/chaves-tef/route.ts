import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

export const GET = withAudit(async (req, session) => {
  try {
    const userId = session.user.id as string;
    const supabase = await getAuditedClient(userId);

    const { data: chaves, error } = await supabase
      .from('tecnologia_ia_chaves_tef')
      .select(`
        *,
        operacao:operacoes (
          id,
          nome_operacao,
          codigo_operacao
        ),
        automacao:automacoes_catalogo (
          id,
          nome,
          homologado
        )
      `)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar chaves TEF:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(chaves || []);
  } catch (error: any) {
    console.error('Exceção ao buscar chaves TEF:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a requisição' },
      { status: 500 }
    );
  }
});

export const POST = withAudit(async (req, session) => {
  try {
    const userId = session.user.id as string;
    const body = await req.json();
    const {
      operacao_id,
      automacao_id,
      chave,
      concentrador,
      nome_dispositivo,
      anydesk_id,
      sistema_operacional,
      status,
      observacao,
    } = body;

    if (!operacao_id || !chave || !nome_dispositivo) {
      return NextResponse.json(
        { error: 'Os campos [operacao_id, chave, nome_dispositivo] são obrigatórios.' },
        { status: 400 }
      );
    }

    const supabase = await getAuditedClient(userId);

    const { data: novaChave, error } = await supabase
      .from('tecnologia_ia_chaves_tef')
      .insert({
        operacao_id,
        automacao_id: automacao_id || null,
        chave,
        concentrador,
        nome_dispositivo,
        anydesk_id: anydesk_id || null,
        sistema_operacional: sistema_operacional || null,
        status: status || 'ATIVO',
        observacao,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(novaChave, { status: 201 });
  } catch (error: any) {
    console.error('Exceção ao criar chave TEF:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a requisição', detalhes: error.message },
      { status: 500 }
    );
  }
});
