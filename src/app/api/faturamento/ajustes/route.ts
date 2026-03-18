import { NextRequest, NextResponse } from 'next/server';
import { getAuditedClient, withAudit } from '@/lib/audit';

/**
 * API para Gestão de Ajustes Financeiros no Faturamento
 * POST /api/faturamento/ajustes - Criar novo ajuste
 */
export const POST = withAudit(async (req, session) => {
  try {
    const body = await req.json();
    const { 
        operacao_id, 
        data_referencia, 
        tipo_ajuste, 
        categoria_ajuste, 
        forma_pagamento, 
        valor, 
        sinal, 
        motivo, 
        observacao 
    } = body;

    if (!operacao_id || !data_referencia || !tipo_ajuste || !valor || !motivo || isNaN(valor)) {
        return NextResponse.json({ error: 'Dados obrigatórios ausentes ou valor inválido' }, { status: 400 });
    }

    const userId = session.user.id as string;
    const supabase = await getAuditedClient(userId);

    // 1. Inserir o ajuste
    const { data: ajuste, error: errAjuste } = await supabase
        .from('faturamento_ajustes')
        .insert({
            operacao_id,
            data_referencia,
            tipo_ajuste,
            categoria_ajuste,
            forma_pagamento: forma_pagamento || 'Ajuste Manual',
            valor,
            sinal: sinal || 1,
            motivo,
            observacao,
            status: 'Aprovado', // Por enquanto aprovamos automático, no futuro pode ter workflow
            criado_por: userId,
            aprovado_por: userId
        })
        .select()
        .single();

    if (errAjuste) {
        console.error('Erro ao salvar ajuste:', errAjuste);
        return NextResponse.json({ error: errAjuste.message || 'Erro ao salvar ajuste financeiro' }, { status: 500 });
    }

    // O Reprocessamento do resumo diário será feito automaticamente pelo TRIGGER no banco.

    return NextResponse.json({ 
        success: true, 
        message: 'Ajuste aplicado com sucesso',
        id: ajuste.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Falha no ajustes POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
