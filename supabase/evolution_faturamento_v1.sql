-- ============================================================
-- LEVE ERP — Módulo FATURAMENTO (Migração da coleta-prescon)
-- ============================================================

-- 1. Adaptação da tabela eixo 'operacoes'
-- Adicionamos as colunas da base antiga respeitando a estrutura do ERP
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS sql_server VARCHAR(255);
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS sql_database VARCHAR(255);
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS automacao_tipo VARCHAR(100);
-- Campo de Rastreabilidade do Legado (Opcional, mas útil para referenciar o ID original)
ALTER TABLE public.operacoes ADD COLUMN IF NOT EXISTS id_legado UUID;

-- Criar índices para os novos campos de busca
CREATE INDEX IF NOT EXISTS idx_operacoes_slug ON operacoes(slug);
CREATE INDEX IF NOT EXISTS idx_operacoes_id_legado ON operacoes(id_legado);

-- 2. Tabela Histórica de Movimentações de Faturamento
-- Vinculada estritamente à tabela mestre 'operacoes' do ERP
CREATE TABLE IF NOT EXISTS public.faturamento_movimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operacao_id UUID NOT NULL REFERENCES public.operacoes(id) ON DELETE CASCADE,
    
    -- Dados da Movimentação / Ticket
    ticket_id VARCHAR(50),
    data_entrada TIMESTAMPTZ,
    data_saida TIMESTAMPTZ,
    valor NUMERIC(10,2),
    forma_pagamento VARCHAR(50),
    tipo_movimento VARCHAR(100),
    descricao TEXT,
    ticket_label VARCHAR(100),
    
    -- Metadados de Importação / Rastreabilidade
    data_importacao TIMESTAMPTZ DEFAULT NOW(),
    id_legado UUID, -- ID original da tabela movimentos_central da coleta-prescon
    
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices essenciais faturamento
CREATE INDEX IF NOT EXISTS idx_fat_mov_operacao ON faturamento_movimentos(operacao_id);
CREATE INDEX IF NOT EXISTS idx_fat_mov_entrada ON faturamento_movimentos(data_entrada DESC);
CREATE INDEX IF NOT EXISTS idx_fat_mov_saida ON faturamento_movimentos(data_saida DESC);
CREATE INDEX IF NOT EXISTS idx_fat_mov_forma ON faturamento_movimentos(forma_pagamento);
CREATE INDEX IF NOT EXISTS idx_fat_mov_legado ON faturamento_movimentos(id_legado);

-- 3. Trigger de atualizado_em para a nova tabela
CREATE OR REPLACE TRIGGER trg_faturamento_movimentos_atualizado_em
  BEFORE UPDATE ON faturamento_movimentos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- 4. Ativar Auditoria Global no Módulo de Faturamento
DO $$ 
BEGIN
    CALL sp_ativar_auditoria_tabela('faturamento_movimentos');
END $$;
