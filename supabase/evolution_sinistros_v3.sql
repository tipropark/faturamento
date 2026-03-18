-- ============================================================
-- EVOLUÇÃO MÓDULO SINISTRO V3 — LEVE ERP
-- Adiciona campo para justificativa de ausência de imagens
-- ============================================================

ALTER TABLE sinistros ADD COLUMN IF NOT EXISTS justificativa_ausencia_imagens TEXT;

-- Re-sincronizar cache do esquema
NOTIFY pgrst, 'reload schema';
