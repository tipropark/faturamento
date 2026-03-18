-- ============================================================
-- EVOLUÇÃO MÓDULO SINISTRO V4 — LEVE ERP
-- Adiciona suporte para IDs de arquivos do Google Drive
-- ============================================================

ALTER TABLE anexos ADD COLUMN IF NOT EXISTS drive_file_id TEXT;

-- Re-sincronizar cache do esquema
NOTIFY pgrst, 'reload schema';
