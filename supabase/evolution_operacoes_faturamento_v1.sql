-- ============================================================
-- LEVE ERP — EVOLUÇÃO OPERAÇÕES (Integração Faturamento)
-- ============================================================

-- 1. Novos campos para controle de sincronização automática e integridade do formulário
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS habilitar_faturamento BOOLEAN DEFAULT FALSE;
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS ponto_bat TEXT;
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS script_coleta TEXT;
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS segmento_local TEXT;
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS automacao_sistema TEXT;
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS automacao_arquitetura TEXT;

-- 2. Índice para acelerar a busca por operações faturáveis
CREATE INDEX IF NOT EXISTS idx_operacoes_faturamento ON public.operacoes(habilitar_faturamento) WHERE habilitar_faturamento = TRUE;

-- 3. Comentários para documentação
COMMENT ON COLUMN public.operacoes.habilitar_faturamento IS 'Define se a operação é elegível para o módulo de faturamento automático';
COMMENT ON COLUMN public.operacoes.ponto_bat IS 'Caminho ou identificação do ponto de execução BAT para coleta';
COMMENT ON COLUMN public.operacoes.script_coleta IS 'Identificação do script de coleta associado';
