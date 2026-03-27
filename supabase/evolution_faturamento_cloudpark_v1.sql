-- Evolution: Integração CloudPark Push
-- Data: 2024-03-27
-- Objetivo: Suporte para recebimento de faturamento via API REST (Push) da CloudPark

-- 1. Ajustes na tabela de Operações para vínculo com CloudPark
ALTER TABLE operacoes 
ADD COLUMN IF NOT EXISTS cloudpark_filial_codigo INT,
ADD COLUMN IF NOT EXISTS integracao_faturamento_tipo VARCHAR(50) DEFAULT 'legado_direto',
ADD COLUMN IF NOT EXISTS cloudpark_ativo BOOLEAN DEFAULT FALSE;

-- 2. Tabela de Logs Brutos da Integração CloudPark
CREATE TABLE IF NOT EXISTS faturamento_integracao_cloudpark_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filial INT NOT NULL,
    payload_original JSONB NOT NULL,
    status_processamento VARCHAR(20) DEFAULT 'PENDENTE', -- PENDENTE, COMPLETO, ERRO, PARCIAL
    mensagem_erro TEXT,
    quantidade_itens INT DEFAULT 0,
    operacao_id UUID REFERENCES operacoes(id),
    recebido_em TIMESTAMPTZ DEFAULT NOW(),
    processado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ajustes na tabela oficial de movimentos para rastreabilidade e deduplicação
ALTER TABLE faturamento_movimentos 
ADD COLUMN IF NOT EXISTS origem_sistema VARCHAR(50) DEFAULT 'AGENTE',
ADD COLUMN IF NOT EXISTS integracao_hash TEXT;

-- Índice único para deduplicação da CloudPark (apenas quando houver hash)
CREATE UNIQUE INDEX IF NOT EXISTS idx_faturamento_movimentos_integracao_hash 
ON faturamento_movimentos (integracao_hash) 
WHERE integracao_hash IS NOT NULL;

-- 4. Funções de Auditoria e Timestamps
SELECT sp_ativar_auditoria_tabela('faturamento_integracao_cloudpark_logs');

CREATE TRIGGER update_faturamento_integracao_cloudpark_logs_atualizado_em
    BEFORE UPDATE ON faturamento_integracao_cloudpark_logs
    FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- Notas de implementação:
-- O campo 'integracao_hash' será gerado na API concatenando campos do item CloudPark.
-- O 'origem_sistema' será preenchido como 'CLOUDPARK' para esses registros.
