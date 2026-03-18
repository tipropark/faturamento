import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * API para o agente local reportar execução
 * POST /api/faturamento/report-execucao
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
        operacao_id, 
        agente_id, 
        status, 
        registros_processados, 
        tempo_execucao_segundos, 
        mensagem 
    } = body;

    if (!operacao_id) {
        return NextResponse.json({ error: 'operacao_id é obrigatório' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // 1. Validar se a operação existe
    const { data: op, error: errOp } = await supabase
        .from('operacoes')
        .select('id, nome_operacao')
        .eq('id', operacao_id)
        .single();

    if (errOp || !op) {
        return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 });
    }

    // 2. Inserir log de execução
    // Opcional: Adicionar lógica de autenticação do agente (API Key) se disponível
    const { data: log, error: errLog } = await supabase
        .from('faturamento_sincronizacoes')
        .insert({
            operacao_id,
            agente_id: agente_id || 'LOCAL-SCRIPT',
            status: status || 'sucesso',
            registros_processados: registros_processados || 0,
            tempo_execucao_segundos: tempo_execucao_segundos || 0,
            mensagem: mensagem || 'Execução reportada pelo script',
            criado_em: new Date().toISOString()
        })
        .select()
        .single();

    if (errLog) {
        console.error('Erro ao registrar execução do agente:', errLog);
        return NextResponse.json({ error: 'Erro ao salvar log de execução' }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Execução reportada com sucesso',
        id: log.id
    }, { status: 201 });

  } catch (error: any) {
    console.error('Falha no report-execucao:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
