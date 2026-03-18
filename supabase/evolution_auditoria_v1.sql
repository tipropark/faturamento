-- ============================================================
-- LEVE ERP — Evolução: Central de Auditoria (v1)
-- ============================================================

-- Tipos para Classificação de Logs
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'criticidade_log') THEN
        CREATE TYPE criticidade_log AS ENUM ('baixa', 'media', 'alta', 'critica');
    END IF;
END $$;

-- Evolução da Tabela auditoria_administrativa
ALTER TABLE auditoria_administrativa ADD COLUMN IF NOT EXISTS submodulo VARCHAR(100);
ALTER TABLE auditoria_administrativa ADD COLUMN IF NOT EXISTS entidade_afetada VARCHAR(100);
ALTER TABLE auditoria_administrativa ADD COLUMN IF NOT EXISTS registro_id VARCHAR(100);
ALTER TABLE auditoria_administrativa ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'sucesso';
ALTER TABLE auditoria_administrativa ADD COLUMN IF NOT EXISTS origem VARCHAR(50) DEFAULT 'manual';
ALTER TABLE auditoria_administrativa ADD COLUMN IF NOT EXISTS criticidade criticidade_log DEFAULT 'baixa';
ALTER TABLE auditoria_administrativa ADD COLUMN IF NOT EXISTS detalhes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE auditoria_administrativa ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE auditoria_administrativa ADD COLUMN IF NOT EXISTS operacao_id UUID; -- Referência à unidade/operação se aplicável

-- Índices para Performance em Alto Volume
CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria_administrativa(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_modulo ON auditoria_administrativa(modulo);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_administrativa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_criticidade ON auditoria_administrativa(criticidade);
CREATE INDEX IF NOT EXISTS idx_auditoria_registro ON auditoria_administrativa(registro_id);

-- View para Dashboard (Opcional, mas útil para performance)
CREATE OR REPLACE VIEW vw_resumo_auditoria AS
SELECT 
  COUNT(*) as total_eventos,
  COUNT(*) FILTER (WHERE criado_em >= NOW() - INTERVAL '24 hours') as eventos_hoje,
  COUNT(*) FILTER (WHERE criticidade IN ('alta', 'critica')) as eventos_criticos,
  COUNT(*) FILTER (WHERE status = 'falha') as total_falhas
FROM auditoria_administrativa;
