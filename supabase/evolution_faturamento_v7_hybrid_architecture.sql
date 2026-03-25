-- ============================================================
-- LEVE ERP — EVOLUÇÃO ARQUITETURAL FATURAMENTO
-- Migração Gradual, Suporte a Múltiplos Sistemas e API 
-- ============================================================

-- 1. Tabela de Templates de Query
CREATE TABLE IF NOT EXISTS public.faturamento_query_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    sistema VARCHAR(50) NOT NULL, -- PRESCON, PARCO, etc
    versao VARCHAR(20) DEFAULT '1.0',
    sql_template TEXT NOT NULL,
    mapping_saida JSONB NOT NULL DEFAULT '{}'::jsonb,
    exemplo_parametros JSONB DEFAULT '{}'::jsonb,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para atualizado_em if exists function
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_atualizado_em') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_faturamento_query_templates_atualizado_em') THEN
            CREATE TRIGGER trg_faturamento_query_templates_atualizado_em
                BEFORE UPDATE ON faturamento_query_templates
                FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
        END IF;
    END IF;
END $$;

-- 2. Atualizar Tabela de Operações com as novas configurações
ALTER TABLE public.operacoes 
    ADD COLUMN IF NOT EXISTS integracao_faturamento_tipo VARCHAR(50) DEFAULT 'legado_direto',
    ADD COLUMN IF NOT EXISTS query_template_id UUID REFERENCES faturamento_query_templates(id),
    ADD COLUMN IF NOT EXISTS parametros_query JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS usa_query_customizada BOOLEAN DEFAULT FALSE;

-- Comentários
COMMENT ON COLUMN public.operacoes.integracao_faturamento_tipo IS 'Tipo de integração: legado_direto (agente -> banco) ou api_agent (agente -> api)';
COMMENT ON COLUMN public.operacoes.query_template_id IS 'Referência ao template de SQL a ser usado pelo agente';

-- 3. Tabela de Logs de Importação de Faturamento
CREATE TABLE IF NOT EXISTS public.faturamento_importacao_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operacao_id UUID NOT NULL REFERENCES public.operacoes(id) ON DELETE CASCADE,
    data_execucao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quantidade_recebida INTEGER DEFAULT 0,
    quantidade_inserida INTEGER DEFAULT 0,
    quantidade_duplicada INTEGER DEFAULT 0,
    tempo_execucao_ms INTEGER,
    status VARCHAR(50), -- SUCESSO, ERRO, PARCIAL
    integracao_tipo VARCHAR(50),
    erro_mensagem TEXT,
    payload_sumario JSONB,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fat_imp_logs_operacao ON faturamento_importacao_logs(operacao_id);
CREATE INDEX IF NOT EXISTS idx_fat_imp_logs_data ON faturamento_importacao_logs(data_execucao DESC);

-- 4. Garantir restrição de unicidade para deduplicação em faturamento_movimentos
-- O ticket_id deve ser único por operação
ALTER TABLE public.faturamento_movimentos 
    ADD COLUMN IF NOT EXISTS origem_sistema VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payload_original JSONB;

ALTER TABLE public.faturamento_movimentos 
    DROP CONSTRAINT IF EXISTS faturamento_movimentos_operacao_ticket_unique;

ALTER TABLE public.faturamento_movimentos 
    DROP CONSTRAINT IF EXISTS faturamento_movimentos_op_ticket_unique;

ALTER TABLE public.faturamento_movimentos 
    ADD CONSTRAINT faturamento_movimentos_operacao_ticket_unique UNIQUE (operacao_id, ticket_id);

-- 5. Seed de Templates Iniciais (Exemplos)
INSERT INTO public.faturamento_query_templates (codigo, nome, sistema, sql_template, mapping_saida)
VALUES (
    'PRESCON_PADRAO', 
    'Prescon - Coleta Padrão Receita', 
    'PRESCON', 
    'SELECT 
    {ticket_id} AS ticket_id, 
    {data_entrada} AS data_entrada, 
    {data_saida} AS data_saida, 
    {valor} AS valor, 
    {forma_pagamento} AS forma_pagamento,
    ''RECEITA'' AS tipo_movimento
FROM {tabela_movimento} 
WHERE {coluna_data_saida} >= @data_inicio 
  AND {coluna_data_saida} < @data_fim',
    '{"ticket_id": "ticket_id", "data_saida": "data_saida", "valor": "valor", "data_entrada": "data_entrada", "forma_pagamento": "forma_pagamento", "tipo_movimento": "tipo_movimento"}',
    '{"tabela_movimento": "MOVIMENTOS", "coluna_data_saida": "DT_SAIDA"}'
) ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.faturamento_query_templates (codigo, nome, sistema, sql_template, mapping_saida)
VALUES (
    'PARCO_PADRAO', 
    'Parco - Coleta Padrão Receita', 
    'PARCO', 
    'SELECT 
    {ticket_id} AS ticket_id, 
    {data_entrada} AS data_entrada, 
    {data_saida} AS data_saida, 
    {valor} AS valor, 
    {forma_pagamento} AS forma_pagamento,
    ''RECEITA'' AS tipo_movimento
FROM {tabela_movimento} 
WHERE {coluna_data_saida} >= @data_inicio 
  AND {coluna_data_saida} < @data_fim',
    '{"ticket_id": "ticket_id", "data_saida": "data_saida", "valor": "valor", "data_entrada": "data_entrada", "forma_pagamento": "forma_pagamento", "tipo_movimento": "tipo_movimento"}',
    '{"tabela_movimento": "MOVIMENTAC", "coluna_data_saida": "DATA_SAIDA"}'
) ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.faturamento_query_templates (codigo, nome, sistema, sql_template, mapping_saida, exemplo_parametros)
VALUES (
    'PERSONAL_PADRAO',
    'Personal - Coleta Padrão Receita (Firebird)',
    'PERSONAL',
    'SELECT
    CAST(m.CODENTRA AS VARCHAR(100)) AS "ticket_label",
    CAST(m.DT_ENTRA || '' '' || m.HR_ENTRA AS TIMESTAMP) AS "data_entrada",
    CAST(m.DT_SAIDA || '' '' || m.HR_SAIDA AS TIMESTAMP) AS "data_saida",
    m.VALOR_BAI AS "valor",
    CASE
        WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = ''1'' THEN ''DINHEIRO''
        WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = ''2'' THEN ''PIX''
        WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = ''4'' THEN ''CONVENIO''
        WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) IN (''5'', ''P1'') THEN
            CASE
                WHEN TRIM(COALESCE(CAST(m.DESCCARTAO AS VARCHAR(30)), '''')) <> '''' THEN
                    ''CARTAO - '' || TRIM(CAST(m.DESCCARTAO AS VARCHAR(30)))
                ELSE ''CARTAO''
            END
        ELSE ''OUTROS''
    END AS "forma_pagamento",
    ''Avulso'' AS "tipo_movimento"
FROM MOVIMENTACAO m
WHERE m.DT_SAIDA >= ''{data_inicio}'' AND m.DT_SAIDA <= ''{data_fim}''
  AND m.DT_SAIDA IS NOT NULL
  AND m.HR_SAIDA IS NOT NULL
ORDER BY 3',
    '{"ticket_label": "ticket_label", "data_entrada": "data_entrada", "data_saida": "data_saida", "valor": "valor", "forma_pagamento": "forma_pagamento", "tipo_movimento": "tipo_movimento"}',
    '{"data_inicio": "2024-03-01", "data_fim": "2024-03-31"}'
) ON CONFLICT (codigo) DO NOTHING;

