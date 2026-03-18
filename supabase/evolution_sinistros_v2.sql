-- ============================================================
-- EVOLUÇÃO MÓDULO SINISTRO V2 — LEVE ERP
-- Adiciona campos para Redução de Orçamentos, Prevenção e Inconsistências
-- ============================================================

-- 1. Campos para Redução de Orçamentos
ALTER TABLE sinistros ADD COLUMN IF NOT EXISTS reducao_valor_original NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sinistros ADD COLUMN IF NOT EXISTS reducao_valor_negociado NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sinistros ADD COLUMN IF NOT EXISTS reducao_observacao TEXT;
ALTER TABLE sinistros ADD COLUMN IF NOT EXISTS reducao_responsavel_id UUID REFERENCES usuarios(id);
ALTER TABLE sinistros ADD COLUMN IF NOT EXISTS reducao_data DATE;

-- 2. Campos para Prevenção (Aprendizado)
ALTER TABLE sinistros ADD COLUMN IF NOT EXISTS prevencao_observacoes_aprendizado TEXT;

-- 3. Campos para Inconsistências (Rastreabilidade)
ALTER TABLE inconsistencias ADD COLUMN IF NOT EXISTS criado_por_id UUID REFERENCES usuarios(id);

-- 4. Re-sincronizar cache do esquema
NOTIFY pgrst, 'reload schema';
