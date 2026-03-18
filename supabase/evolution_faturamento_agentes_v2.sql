-- ============================================================
-- LEVE ERP — INFRAESTRUTURA DE AGENTES (Faturamento)
-- ============================================================

-- 1. Tabela de Continuidade de Negócio e "Saúde Operacional"
CREATE TABLE IF NOT EXISTS public.faturamento_sincronizacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operacao_id UUID REFERENCES public.operacoes(id) ON DELETE CASCADE,
    agente_id VARCHAR(50),
    status VARCHAR(20),
    registros_processados INTEGER,
    tempo_execucao_segundos NUMERIC(10,2),
    mensagem TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Garantia absoluta Anti-Duplicidade no Motor Principal
-- Permite que o novo arquivo 'core_agent.ps1' rode UPSERT (Atualiza ou Insere) 
-- sem medo de injetar dois tickets iguais pro mesmo pátio/operacao.
ALTER TABLE public.faturamento_movimentos 
ADD CONSTRAINT faturamento_movimentos_op_ticket_unique UNIQUE (operacao_id, ticket_id);

-- 3. Auditoria e Rastreio na Saúde dos Agentes
DO $$ 
BEGIN
    CALL sp_ativar_auditoria_tabela('faturamento_sincronizacoes');
END $$;
