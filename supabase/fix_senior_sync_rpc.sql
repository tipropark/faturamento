-- ============================================================
-- RPC: sp_reportar_saude_operacao
-- Objetivo: Garantir atualização da saúde da operação ignorando RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.sp_reportar_saude_operacao(
    p_operacao_id UUID,
    p_registros INTEGER,
    p_tempo_ms INTEGER,
    p_mensagem TEXT
)
RETURNS VOID AS $$
BEGIN
    -- 1. Inserir no log de sincronização (Ativa triggers do dashboard)
    INSERT INTO public.faturamento_sincronizacoes (
        operacao_id,
        agente_id,
        status,
        registros_processados,
        tempo_execucao_segundos,
        mensagem
    ) VALUES (
        p_operacao_id,
        'API_V2_SENIOR',
        'SUCESSO',
        p_registros,
        p_tempo_ms / 1000.0,
        p_mensagem
    );

    -- 2. Forçar atualização na tabela de operações
    UPDATE public.operacoes
    SET 
        ultima_sincronizacao = NOW(),
        integracao_faturamento_ativa = TRUE,
        integracao_faturamento_tipo = 'api_agent'
    WHERE id = p_operacao_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
