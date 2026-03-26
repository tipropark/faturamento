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
    
    // 1. Extrair e Sanitizar ID da Operação e Token
    const operacao_id = (req.headers.get('x-operacao-id') || body.operacao_id || '').trim();
    const token = (req.headers.get('x-integration-token') || body.token_integracao || '').trim();
    
    if (!operacao_id || !token || !Array.isArray(movimentos)) {
      console.warn('BAD_REQUEST: Payload incompleto ou movimentos não é array', { operacao_id, token });
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
      console.error(`AUTH_FAILED: OpID [${operacao_id}] | Token [${token}]`, opError?.message);
      return NextResponse.json({ error: 'Operação não cadastrada ou Token de Integração inválido.' }, { status: 401 });
    }

    console.log(`[SENIOR_SYNC] Recebendo ${movimentos.length} itens para -> ${op.nome_operacao}`);
    
    // 3. Limpeza Opcional (Evita duplicatas por mudança de versão do agente)
    const purgeToday = req.headers.get('x-purge-today') === 'true';
    if (purgeToday) {
      const today = new Date().toISOString().split('T')[0];
      console.log(`[SENIOR_PURGE] Limpando movimentos e resumos de hoje para ${op.nome_operacao}...`);
      
      // Limpar movimentos brutos
      await supabase
        .from('faturamento_movimentos')
        .delete()
        .eq('operacao_id', operacao_id)
        .gte('data_saida', `${today}T00:00:00.000Z`);

      // Limpar consolidado diário (Obriga o sistema a regerar com os novos valores)
      await supabase
        .from('faturamento_resumo_diario')
        .delete()
        .eq('operacao_id', operacao_id)
        .eq('data_referencia', today);
    }

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

    // Chunking to avoid large payload limits if necessary, but 1000 is safer for performance
    const chunkSize = 1000;
    for (let i = 0; i < preparedMovimentos.length; i += chunkSize) {
      const chunk = preparedMovimentos.slice(i, i + chunkSize);
      
      const { data, error: insertError } = await supabase
        .from('faturamento_movimentos')
        .upsert(chunk, { 
          onConflict: 'operacao_id, ticket_id',
          ignoreDuplicates: false // Permitir ATUALIZAÇÃO para saneamento de dados
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

    // 3. Registrar Log de Importação e Notificar Saúde da Operação (Ativar Triggers)
    const latestMoveDate = movimentos.reduce((max, m) => {
      const d = new Date(m.data_saida);
      return d > max ? d : max;
    }, new Date(0));

    // Executar operações de log e status de forma sequencial para capturar erros específicos
    const { error: errLog } = await supabase.from('faturamento_importacao_logs').insert({
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

    const { error: errSync } = await supabase.from('faturamento_sincronizacoes').insert({
      operacao_id,
      agente_id: 'API_V2_AGENT',
      status: errorCount > 0 ? 'ALERTA' : 'SUCESSO',
      registros_processados: inserted,
      tempo_execucao_segundos: duration / 1000,
      mensagem: `Importação em Massa via API - ${inserted} registros.`
    });

    // 4. ATUALIZAÇÃO DRÁSTICA DE SAÚDE (Forçar flag de ativa)
    const { error: errOpUpdate } = await supabase.from('operacoes').update({ 
      ultima_sincronizacao: new Date().toISOString(),
      ultimo_movimento_em: latestMoveDate > new Date(0) ? latestMoveDate.toISOString() : undefined,
      integracao_faturamento_ativa: true,
      integracao_faturamento_tipo: 'api_agent'
    }).eq('id', operacao_id);

      // 5. Forçar Consolidação Imediata do Resumo (Power Feature)
      await supabase.rpc('faturamento_consolidar_dia_v2', { 
        p_operacao_id: operacao_id, 
        p_data: new Date().toISOString().split('T')[0] 
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
