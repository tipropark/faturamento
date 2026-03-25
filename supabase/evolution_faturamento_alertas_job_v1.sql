-- 6. Tabela de Controle de Jobs de Auditoria
CREATE TABLE IF NOT EXISTS faturamento_alertas_v2_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ultima_execucao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    periodo_execucao_horas INTEGER DEFAULT 4,
    status_execucao VARCHAR(50) DEFAULT 'sucesso', -- 'sucesso', 'falha', 'em_processamento'
    quantidade_processada INTEGER DEFAULT 0,
    erros TEXT,
    configuracoes JSONB DEFAULT '{}'
);

-- Inserir registro inicial se não existir
INSERT INTO faturamento_alertas_v2_status (periodo_execucao_horas, status_execucao)
VALUES (4, 'sucesso')
ON CONFLICT DO NOTHING;

-- Adicionar coluna validade em faturamento_alertas se não existir (opcional para o cache)
ALTER TABLE faturamento_alertas ADD COLUMN IF NOT EXISTS expira_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE faturamento_alertas ADD COLUMN IF NOT EXISTS tipo_alerta VARCHAR(100); -- código amigável da regra
