-- 1. GARANTIR QUE AS COLUNAS EXISTEM (Isolamento v4)
-- Caso o v3_sync não tenha rodado ou falhado, garantimos aqui.
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS ultima_sincronizacao TIMESTAMPTZ;
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS ultimo_movimento_em TIMESTAMPTZ;

-- 2. READEQUAR O TRIGGER DE MOVIMENTOS
-- O trigger em faturamento_movimentos agora deve atualizar apenas 'ultimo_movimento_em'
CREATE OR REPLACE FUNCTION update_last_movement_operation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.operacoes
    SET ultimo_movimento_em = NEW.data_importacao
    WHERE id = NEW.operacao_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Garante execução mesmo com RLS restritivo

DROP TRIGGER IF EXISTS trg_update_last_movement ON public.faturamento_movimentos;
CREATE TRIGGER trg_update_last_movement
AFTER INSERT ON public.faturamento_movimentos
FOR EACH ROW EXECUTE FUNCTION update_last_movement_operation();

-- 3. CRIAR TRIGGER PARA ATUALIZAR 'ultima_sincronizacao' BASEADO NA EXECUÇÃO DO AGENTE
-- Toda vez que o agente reportar execução (mesmo com 0 registros), atualizamos 'ultima_sincronizacao'
CREATE OR REPLACE FUNCTION update_last_agent_run_operation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.operacoes
    SET ultima_sincronizacao = NEW.criado_em
    WHERE id = NEW.operacao_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Garante execução mesmo com RLS restritivo

DROP TRIGGER IF EXISTS trg_update_last_agent_run ON public.faturamento_sincronizacoes;
CREATE TRIGGER trg_update_last_agent_run
AFTER INSERT ON public.faturamento_sincronizacoes
FOR EACH ROW EXECUTE FUNCTION update_last_agent_run_operation();

-- 4. ATUALIZAÇÃO RETROATIVA
-- Sincronizar 'ultimo_movimento_em' com o que era 'ultima_sincronizacao' anteriormente
UPDATE public.operacoes op
SET ultimo_movimento_em = (
    SELECT MAX(data_importacao)
    FROM faturamento_movimentos fm
    WHERE fm.operacao_id = op.id
);

-- Garantir que 'ultima_sincronizacao' também considere o log de execuções se houver
UPDATE public.operacoes op
SET ultima_sincronizacao = COALESCE(
    (SELECT MAX(criado_em) FROM faturamento_sincronizacoes fs WHERE fs.operacao_id = op.id),
    op.ultimo_movimento_em -- fallback caso não haja logs de execução ainda
);

-- 5. NOTIFICAR POSTGREST
NOTIFY pgrst, 'reload schema';
