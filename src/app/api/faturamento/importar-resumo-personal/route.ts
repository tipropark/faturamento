import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * API para o agente local importar RESUMO DIÁRIO de faturamento (Operações Personal)
 * POST /api/faturamento/importar-resumo-personal
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const supabase = await createAdminClient();
  
  try {
    const body = await req.json();
    
    // 1. Extrair e Sanitizar Autenticação
    const operacao_id = (req.headers.get('x-operacao-id') || body.operacao_id || '').trim();
    const token = (req.headers.get('x-integration-token') || body.token_integracao || '').trim();
    
    // 2. Validar Presença de Dados Obrigatórios
    if (!operacao_id || !token) {
      return NextResponse.json({ 
        error: 'Autenticação inválida: x-operacao-id e x-integration-token são obrigatórios' 
      }, { status: 401 });
    }

    const { data_referencia, resumo, resumo_por_forma_pagamento, resumo_por_tipo, metadata, schema_version, agent_version, integration_type } = body;

    if (!data_referencia || !resumo) {
      return NextResponse.json({ 
        error: 'Payload incompleto: data_referencia e resumo são obrigatórios' 
      }, { status: 400 });
    }

    // 3. Validar Operação, Token e Modo de Integração
    const { data: op, error: opError } = await supabase
      .from('operacoes')
      .select('id, nome_operacao, faturamento_modo_integracao, token_integracao')
      .eq('id', operacao_id)
      .eq('token_integracao', token)
      .single();

    if (opError || !op) {
      return NextResponse.json({ error: 'Operação não cadastrada ou Token de Integração inválido.' }, { status: 401 });
    }

    if (op.faturamento_modo_integracao !== 'personal_resumo_diario') {
      return NextResponse.json({ 
        error: `Operação não está configurada para resumo diário. Modo atual: ${op.faturamento_modo_integracao || 'movimentos_detalhados'}` 
      }, { status: 403 });
    }

    // 4. Preparar Dados para Staging (UPSERT Idempotente)
    const stagingData = {
      operacao_id,
      data_referencia,
      origem_sistema: metadata?.origem_sistema || 'PERSONAL',
      schema_version: schema_version || '1.0.0',
      agent_version: agent_version || '1.0.0',
      integration_type: integration_type || 'personal_resumo_diario',
      total_receita_original: parseFloat(resumo.total_receita_original || 0),
      total_avulso_original: parseFloat(resumo.total_avulso_original || 0),
      total_mensalista_original: parseFloat(resumo.total_mensalista_original || 0),
      total_geral: parseFloat(resumo.total_geral || 0),
      resumo_por_tipo_json: resumo_por_tipo || {},
      resumo_por_forma_pagamento_json: resumo_por_forma_pagamento || {},
      payload_original: body,
      hash_lote: metadata?.hash_lote || null,
      status_importacao: 'processado',
      atualizado_em: new Date().toISOString()
    };

    // 5. UPSERT na Tabela de Staging
    const { error: upsertError } = await supabase
      .from('faturamento_resumo_importado')
      .upsert(stagingData, { 
        onConflict: 'operacao_id, data_referencia, origem_sistema'
      });

    if (upsertError) {
      console.error('STAGING_UPSERT_ERROR:', upsertError);
      return NextResponse.json({ error: 'Erro ao persistir resumo importado: ' + upsertError.message }, { status: 500 });
    }

    // Nota: O Trigger 'trg_after_resumo_importado_sync' no banco de dados cuidará de 
    // chamar 'reprocessar_faturamento_dia' para refletir os dados em 'faturamento_resumo_diario'.

    const duration = Date.now() - startTime;

    // 6. Registrar Log Técnico de Sincronização
    await supabase.from('faturamento_sincronizacoes').insert({
      operacao_id,
      agente_id: 'API_PERSONAL_RESUMO',
      status: 'SUCESSO',
      registros_processados: 1,
      tempo_execucao_segundos: duration / 1000,
      mensagem: `Resumo diário Personal importado para ${data_referencia}.`
    });

    // 7. Atualizar Saúde da Operação
    await supabase.from('operacoes').update({ 
      ultima_sincronizacao: new Date().toISOString(),
      integracao_faturamento_ativa: true
    }).eq('id', operacao_id);

    return NextResponse.json({
      success: true,
      message: 'Resumo diário processado com sucesso',
      stats: {
          data_referencia,
          total_geral: stagingData.total_geral
      },
      tempo_ms: duration
    });

  } catch (err: any) {
    console.error('IMPORT_RESUMO_PERSONAL_ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
