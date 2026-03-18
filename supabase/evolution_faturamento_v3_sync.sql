-- ============================================================
-- LEVE ERP — EVOLUÇÃO FATURAMENTO (Campos de Sincronização)
-- ============================================================

-- 1. Adicionar coluna de última sincronização na tabela de operações
-- Isso evita cálculos custosos na dashboard ao listar muitas unidades
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS ultima_sincronizacao TIMESTAMPTZ;

-- 2. Criar função de trigger para atualizar automaticamente a data de sincronização
-- Sempre que um novo movimento for importado, atualizamos a operação correspondente
CREATE OR REPLACE FUNCTION update_last_sync_operation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.operacoes
    SET ultima_sincronizacao = NEW.data_importacao
    WHERE id = NEW.operacao_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Vincular trigger à tabela de movimentos
DROP TRIGGER IF EXISTS trg_update_last_sync ON public.faturamento_movimentos;
CREATE TRIGGER trg_update_last_sync
AFTER INSERT ON public.faturamento_movimentos
FOR EACH ROW EXECUTE FUNCTION update_last_sync_operation();

-- 4. Atualização retroativa baseada nos dados existentes
UPDATE public.operacoes op
SET ultima_sincronizacao = (
    SELECT MAX(data_importacao)
    FROM faturamento_movimentos fm
    WHERE fm.operacao_id = op.id
);

-- 5. Comentário para documentação
COMMENT ON COLUMN public.operacoes.ultima_sincronizacao IS 'Data/hora da última sincronização bem-sucedida realizada pelo agente local';
