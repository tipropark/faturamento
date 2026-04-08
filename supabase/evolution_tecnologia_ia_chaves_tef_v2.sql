-- ============================================================
-- LEVE ERP — Módulo Tecnologia & IA / Chaves TEF
-- v2: Adiciona campo anydesk_id
-- ============================================================

ALTER TABLE public.tecnologia_ia_chaves_tef
  ADD COLUMN IF NOT EXISTS anydesk_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sistema_operacional VARCHAR(20);
