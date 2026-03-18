-- ============================================================
-- EVOLUÇÃO MÓDULO SINISTRO — LEVE ERP
-- ============================================================

-- 1. Novos Tipos ENUM
CREATE TYPE status_inconsistencia AS ENUM ('pendente', 'aprovada', 'reprovada', 'corrigida');

CREATE TYPE categoria_sinistro AS ENUM (
  'avaria', 'furto', 'colisao', 'estrutural', 'reclamacao_posterior', 'outros'
);

-- 2. Atualizar categoria_anexo ENUM (se possível ou recriar)
-- No Postgres, adicionar valores ao ENUM existente:
ALTER TYPE categoria_anexo ADD VALUE 'documentos_cliente';
ALTER TYPE categoria_anexo ADD VALUE 'documento_veiculo';
ALTER TYPE categoria_anexo ADD VALUE 'cnh_rg_cpf';
ALTER TYPE categoria_anexo ADD VALUE 'ticket_cupom_fiscal';
ALTER TYPE categoria_anexo ADD VALUE 'boletim_ocorrencia';
ALTER TYPE categoria_anexo ADD VALUE 'orcamento_sinistrado';
ALTER TYPE categoria_anexo ADD VALUE 'reducao_orcamentos';
ALTER TYPE categoria_anexo ADD VALUE 'evidencia_conclusao';

-- 3. Adicionar novas colunas na tabela sinistros para Prevenção e SLA
ALTER TABLE sinistros ADD COLUMN categoria_sinistro categoria_sinistro;
ALTER TABLE sinistros ADD COLUMN motivo_especifico VARCHAR(255);
ALTER TABLE sinistros ADD COLUMN local_detalhado VARCHAR(255); -- setor/vaga/piso
ALTER TABLE sinistros ADD COLUMN data_limite_sla DATE;
ALTER TABLE sinistros ADD COLUMN fora_do_prazo_abertura BOOLEAN DEFAULT FALSE;

-- Campos de Prevenção
ALTER TABLE sinistros ADD COLUMN prevencao_melhoria TEXT;
ALTER TABLE sinistros ADD COLUMN prevencao_como_evitar TEXT;
ALTER TABLE sinistros ADD COLUMN prevencao_acao_recomendada TEXT;
ALTER TABLE sinistros ADD COLUMN prevencao_responsavel_id UUID REFERENCES usuarios(id);
ALTER TABLE sinistros ADD COLUMN prevencao_status_acao VARCHAR(50) DEFAULT 'pendente';

-- 4. Tabela de Inconsistências
CREATE TABLE inconsistencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sinistro_id UUID NOT NULL REFERENCES sinistros(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status status_inconsistencia NOT NULL DEFAULT 'pendente',
  motivo_decisao TEXT,
  analisado_por_id UUID REFERENCES usuarios(id),
  data_decisao TIMESTAMPTZ,
  anexo_url TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inconsistencias_sinistro ON inconsistencias(sinistro_id);

-- Trigger para atualizado_em em inconsistencias
CREATE TRIGGER trg_inconsistencias_atualizado_em
  BEFORE UPDATE ON inconsistencias
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
