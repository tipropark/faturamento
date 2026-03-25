import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * API para o agente local importar movimentos de faturamento (Novo Modelo)
 * POST /api/faturamento/importar-movimentos
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const supabase = await createAdminClient();
  
  try {
    const body = await req.json();
    const { movimentos } = body;
    
    // 1. Extrair ID da Operação e Token dos Headers (ou body como fallback se necessário)
    const operacao_id = req.headers.get('x-operacao-id') || body.operacao_id;
    const token = req.headers.get('x-integration-token') || body.token_integracao;

    if (!operacao_id || !token || !Array.isArray(movimentos)) {
      return NextResponse.json({ 
        error: 'Payload inválido: x-operacao-id, x-integration-token e movimentos são obrigatórios' 
      }, { status: 400 });
    }

    // 2. Validar operação e token_integracao
    const { data: op, error: opError } = await supabase
      .from('operacoes')
      .select('id, nome_operacao, integracao_faturamento_tipo, automacao_sistema, token_integracao')
      .eq('id', operacao_id)
      .eq('token_integracao', token)
      .single();

    if (opError || !op) {
      console.warn(`AUTH_INTEGRACAO_FAIL: Op: ${operacao_id} | Token: ${token ? 'PROVIDED' : 'MISSING'}`);
      return NextResponse.json({ error: 'Operação não encontrada ou Token inválido' }, { status: 401 });
    }

    console.log(`IMPORT_FAT: Recebendo ${movimentos.length} movimentos para Op: ${op.nome_operacao}`);

    let inserted = 0;
    let duplicated = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // 2. Processar movimentos (Deduplicação via UPSERT)
    // Usaremos a restrição UNIQUE (operacao_id, ticket_id)
    
    // Batch upsert for better performance
    const preparedMovimentos = movimentos.map(mov => ({
      operacao_id,
      ticket_id: String(mov.ticket_id),
      data_entrada: mov.data_entrada,
      data_saida: mov.data_saida,
      valor: parseFloat(mov.valor || 0),
      forma_pagamento: mov.forma_pagamento,
      tipo_movimento: mov.tipo_movimento || 'RECEITA',
      origem_sistema: mov.origem_sistema || op.automacao_sistema,
      payload_original: mov,
      atualizado_em: new Date().toISOString()
    }));

    // Chunking to avoid large payload limits if necessary, but 100-500 is usually fine
    const chunkSize = 100;
    for (let i = 0; i < preparedMovimentos.length; i += chunkSize) {
      const chunk = preparedMovimentos.slice(i, i + chunkSize);
      
      const { data, error: insertError } = await supabase
        .from('faturamento_movimentos')
        .upsert(chunk, { 
          onConflict: 'operacao_id, ticket_id',
          ignoreDuplicates: true // Ignorar duplicados (deduplicação)
        })
        .select('id');

      if (insertError) {
        console.error('UPSERT_CHUNK_ERROR:', insertError);
        errorCount += chunk.length;
        errors.push(insertError.message);
      } else {
        inserted += (data?.length || 0);
        duplicated += (chunk.length - (data?.length || 0));
      }
    }

    const duration = Date.now() - startTime;

    // 3. Registrar Log de Importação
    await supabase.from('faturamento_importacao_logs').insert({
      operacao_id,
      quantidade_recebida: movimentos.length,
      quantidade_inserida: inserted,
      quantidade_duplicada: duplicated,
      tempo_execucao_ms: duration,
      status: errorCount > 0 ? (inserted > 0 ? 'PARCIAL' : 'ERRO') : 'SUCESSO',
      integracao_tipo: op.integracao_faturamento_tipo || 'api_agent',
      erro_mensagem: errors.length > 0 ? errors.join(' | ') : null,
      payload_sumario: { 
        primeiro_ticket: movimentos[0]?.ticket_id,
        ultimo_ticket: movimentos[movimentos.length - 1]?.ticket_id
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        recebidos: movimentos.length,
        inseridos: inserted,
        duplicados: duplicated,
        erros: errorCount
      },
      tempo_ms: duration
    });

  } catch (err: any) {
    console.error('SERVER_IMPORT_FATURAMENTO_ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
