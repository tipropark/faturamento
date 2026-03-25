-- 1. Adicionar token_integracao na tabela de operacoes
-- Usamos uuid_generate_v4() se disponível, ou apenas permitimos nulo para preenchimento posterior
ALTER TABLE operacoes ADD COLUMN IF NOT EXISTS token_integracao UUID DEFAULT gen_random_uuid();

-- 2. Garantir que todas as operações existentes tenham um token
UPDATE operacoes SET token_integracao = gen_random_uuid() WHERE token_integracao IS NULL;

-- 3. Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_operacoes_token_integracao ON operacoes(token_integracao);

-- 4. Adicionar integracao_ativa na tabela de operacoes
ALTER TABLE operacoes ADD COLUMN IF NOT EXISTS integracao_faturamento_ativa BOOLEAN DEFAULT FALSE;
