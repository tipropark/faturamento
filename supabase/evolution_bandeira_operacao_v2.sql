-- ============================================================
-- LEVE ERP — Atualização do Enum bandeira_operacao
-- v2: Substitui valores antigos pelos novos padrões comerciais
-- ============================================================

-- Adicionar novos valores ao enum existente
ALTER TYPE bandeira_operacao ADD VALUE IF NOT EXISTS 'ASSAI';
ALTER TYPE bandeira_operacao ADD VALUE IF NOT EXISTS 'ATACADÃO';
ALTER TYPE bandeira_operacao ADD VALUE IF NOT EXISTS 'CARREFOUR';
ALTER TYPE bandeira_operacao ADD VALUE IF NOT EXISTS 'GPA';
ALTER TYPE bandeira_operacao ADD VALUE IF NOT EXISTS 'GRUPO MATEUS';
ALTER TYPE bandeira_operacao ADD VALUE IF NOT EXISTS 'IBIS';
ALTER TYPE bandeira_operacao ADD VALUE IF NOT EXISTS 'REDE PRÓPRIA';
ALTER TYPE bandeira_operacao ADD VALUE IF NOT EXISTS 'SELFIT';
ALTER TYPE bandeira_operacao ADD VALUE IF NOT EXISTS 'UNIMED';
ALTER TYPE bandeira_operacao ADD VALUE IF NOT EXISTS 'SAM''S CLUB';
