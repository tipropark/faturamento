-- ============================================================
-- LEVE ERP — Evolução: Módulo Tarifários e Convênios
-- ============================================================

-- 1. Adicionar perfil 'ti' ao enum existente
-- Nota: PostgreSQL não permite ALTER TYPE ADD VALUE dentro de transações em algumas versões, 
-- mas no Supabase costuma funcionar.
ALTER TYPE perfil_usuario ADD VALUE IF NOT EXISTS 'ti';

-- 2. Novos Enums para o Módulo
DO $$ BEGIN
    CREATE TYPE tipo_solicitacao_tarifario AS ENUM (
      'cadastro_novo_tarifario',
      'alteracao_tarifario_existente',
      'cadastro_novo_convenio',
      'alteracao_convenio_existente'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_solicitacao_tarifario AS ENUM (
      'pendente',
      'aprovado',
      'reprovado',
      'em_execucao',
      'concluido'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tabela de Solicitações
CREATE TABLE IF NOT EXISTS solicitacoes_tarifario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operacao_id UUID NOT NULL REFERENCES operacoes(id),
  solicitante_id UUID NOT NULL REFERENCES usuarios(id),
  tipo tipo_solicitacao_tarifario NOT NULL,
  data_desejada DATE NOT NULL,
  descricao TEXT NOT NULL,
  status status_solicitacao_tarifario NOT NULL DEFAULT 'pendente',
  
  -- Aprovação (Diretoria)
  diretoria_id UUID REFERENCES usuarios(id),
  data_parecer TIMESTAMPTZ,
  parecer_diretoria TEXT,
  
  -- Execução (TI)
  tecnico_ti_id UUID REFERENCES usuarios(id),
  data_inicio_execucao TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  obs_tecnica TEXT,
  
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarifarios_status ON solicitacoes_tarifario(status);
CREATE INDEX IF NOT EXISTS idx_tarifarios_operacao ON solicitacoes_tarifario(operacao_id);
CREATE INDEX IF NOT EXISTS idx_tarifarios_solicitante ON solicitacoes_tarifario(solicitante_id);

-- 4. Tabela de Anexos do Módulo
CREATE TABLE IF NOT EXISTS tarifarios_anexos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes_tarifario(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  drive_file_id TEXT,
  tamanho BIGINT,
  tipo_mime VARCHAR(100),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarifarios_anexos_solicitacao ON tarifarios_anexos(solicitacao_id);

-- 5. Tabela de Histórico/Auditoria
CREATE TABLE IF NOT EXISTS tarifarios_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes_tarifario(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  acao VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarifarios_historico_solicitacao ON tarifarios_historico(solicitacao_id);

-- 6. Trigger para atualizado_em
CREATE TRIGGER trg_solicitacoes_tarifario_atualizado_em
  BEFORE UPDATE ON solicitacoes_tarifario
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
