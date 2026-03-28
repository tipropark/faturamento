import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const maxDuration = 300; // 5 minutos de processamento máximo

/**
 * API para integração Push da CloudPark
 * POST /api/integracoes/cloudpark/receber-movimentos
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const supabase = await createAdminClient();
  
  // 1. Validar Token de Autenticação (Header)
  const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
  const systemToken = process.env.CLOUDPARK_API_TOKEN || 'leve-cloudpark-secret-2024';

  if (!authToken || authToken !== systemToken) {
    console.warn('[CLOUDPARK_AUTH_FAILED] Tentativa de acesso sem token válido');
    return NextResponse.json({ error: 'Não autorizado. Token inválido.' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  const { filial, items } = body;

  // 2. Validação Básica
  if (!filial || !Array.isArray(items)) {
    return NextResponse.json({ error: 'Campos "filial" e "items" (array) são obrigatórios.' }, { status: 400 });
  }

  // 3. Localizar Operação Vinculada
  const { data: operacao, error: opError } = await supabase
    .from('operacoes')
    .select('id, nome_operacao, cloudpark_ativo')
    .eq('cloudpark_filial_codigo', filial)
    .single();

  if (opError || !operacao) {
    // Registrar log de erro mesmo se a operação não for encontrada
    await supabase.from('faturamento_integracao_cloudpark_logs').insert({
      filial,
      payload_original: body,
      status_processamento: 'ERRO',
      mensagem_erro: `Operação não encontrada para filial ${filial}`,
      quantidade_items: items.length
    });

    return NextResponse.json({ error: `Filial ${filial} não está vinculada a nenhuma operação no Leve ERP.` }, { status: 404 });
  }

  if (!operacao.cloudpark_ativo) {
    return NextResponse.json({ error: `A integração CloudPark para a operação ${operacao.nome_operacao} está inativa.` }, { status: 403 });
  }

  // 4. Criar Log Inicial do Recebimento
  const { data: logEntry, error: logError } = await supabase
    .from('faturamento_integracao_cloudpark_logs')
    .insert({
      filial,
      operacao_id: operacao.id,
      payload_original: body,
      quantidade_itens: items.length,
      status_processamento: 'PROCESSANDO'
    })
    .select('id')
    .single();

  const logId = logEntry?.id;

  try {
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    // 5. Normalizar e Processar Itens
    const preparedItems = items.map((item: any) => {
      // Log diagnóstico para identificar campos da CloudPark
      console.log('DEBUG CLOUDPARK ITEM:', JSON.stringify(item));
      // Estratégia de Deduplicação: Hash de campos únicos
      const hashContent = `${filial}|${item.payday}|${item.value}|${item.category}|${item.payment_method}|${item.description}`;
      const integracao_hash = crypto.createHash('sha256').update(hashContent).digest('hex');

      return {
        operacao_id: operacao.id,
        ticket_id: `CP-${integracao_hash.substring(0, 12)}`, // ID legível para display
        data_entrada: item.payday, // CloudPark envia apenas o payday (saída/pagamento)
        data_saida: item.payday,
        valor: Number(item.value || 0),
        forma_pagamento: (item.payment_method || '').toUpperCase(),
        tipo_movimento: (item.category || 'AVULSO').toUpperCase(),
        descricao: item.description,
        origem_sistema: 'CLOUDPARK',
        integracao_hash,
        payload_original: item,
        atualizado_em: new Date().toISOString()
      };
    });

    // Batch UPSERT (Deduplicação automática via banco na constraint integracao_hash)
    const { data: upsertData, error: upsertError } = await supabase
      .from('faturamento_movimentos')
      .upsert(preparedItems, {
        onConflict: 'integracao_hash',
        ignoreDuplicates: true // Se já existe o hash, ignora (Deduplicação)
      })
      .select('id');

    if (upsertError) {
      throw upsertError;
    }

    inserted = upsertData?.length || 0;
    skipped = items.length - inserted;

    // 6. Atualizar Log com Resultado Final
    await supabase
      .from('faturamento_integracao_cloudpark_logs')
      .update({
        status_processamento: 'COMPLETO',
        processado_em: new Date().toISOString(),
        mensagem_erro: skipped > 0 ? `${skipped} itens ignorados por duplicidade.` : null
      })
      .eq('id', logId);

    // 7. Forçar Re-Consolidação do Dia (Power Feature)
    // Buscamos as datas distintas enviadas para re-consolidar apenas o necessário
    const distinctDates = Array.from(new Set(items.map((i: any) => i.payday.split('T')[0])));
    
    for (const d of distinctDates) {
      await supabase.rpc('faturamento_consolidar_dia_v2', { 
        p_operacao_id: operacao.id, 
        p_data: d 
      });
    }

    // 8. Atualizar o timestamp de "Última Sincronização" na Operação
    await supabase
      .from('operacoes')
      .update({ ultima_sincronizacao: new Date().toISOString() })
      .eq('id', operacao.id);

    return NextResponse.json({
      success: true,
      message: 'Processamento concluído',
      detalhes: {
        total_recebido: items.length,
        total_inserido: inserted,
        total_duplicado: skipped,
        operacao: operacao.nome_operacao
      },
      duracao_ms: Date.now() - startTime
    });

  } catch (err: any) {
    console.error('[CLOUDPARK_API_ERROR]', err);
    
    // Atualizar log com o erro
    if (logId) {
      await supabase
        .from('faturamento_integracao_cloudpark_logs')
        .update({
          status_processamento: 'ERRO',
          mensagem_erro: err.message,
          processado_em: new Date().toISOString()
        })
        .eq('id', logId);
    }

    return NextResponse.json({ 
      error: 'Erro interno ao processar itens', 
      message: err.message 
    }, { status: 500 });
  }
}
