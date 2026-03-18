-- ============================================================
-- LEVE ERP — Schema Supabase (PostgreSQL)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE perfil_usuario AS ENUM (
  'administrador', 'diretoria', 'gerente_operacoes', 'supervisor',
  'analista_sinistro', 'financeiro', 'rh', 'dp', 'auditoria', 'administrativo'
);

CREATE TYPE status_usuario AS ENUM ('ativo', 'inativo');

CREATE TYPE bandeira_operacao AS ENUM ('GPA', 'Assaí', 'Carrefour', 'TriCeplo', 'Outros');

CREATE TYPE tipo_operacao AS ENUM (
  'supermercado', 'shopping', 'hospital', 'predio_comercial', 'estacionamento', 'outro'
);

CREATE TYPE status_operacao AS ENUM ('ativa', 'inativa');

CREATE TYPE status_sinistro AS ENUM (
  'aberto', 'em_analise', 'aguardando_documentos', 'aprovado', 'reprovado', 'encerrado'
);

CREATE TYPE prioridade_sinistro AS ENUM ('baixa', 'media', 'alta', 'urgente');

CREATE TYPE categoria_anexo AS ENUM (
  'imagens_ocorrencia', 'evidencias_adicionais', 'orcamento', 'documentos', 'comprovantes_financeiros'
);

-- ============================================================
-- TABELA: usuarios
-- ============================================================

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil perfil_usuario NOT NULL DEFAULT 'supervisor',
  telefone VARCHAR(20),
  status status_usuario NOT NULL DEFAULT 'ativo',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  gerente_operacoes_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX idx_usuarios_gerente ON usuarios(gerente_operacoes_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- ============================================================
-- TABELA: operacoes
-- ============================================================

CREATE TABLE operacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_operacao VARCHAR(255) NOT NULL,
  codigo_operacao VARCHAR(50) UNIQUE NOT NULL,
  bandeira bandeira_operacao NOT NULL,
  tipo_operacao tipo_operacao NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  uf CHAR(2) NOT NULL,
  endereco TEXT,
  quantidade_vagas INTEGER NOT NULL DEFAULT 0,
  possui_cftv BOOLEAN NOT NULL DEFAULT FALSE,
  supervisor_id UUID NOT NULL REFERENCES usuarios(id),
  gerente_operacoes_id UUID REFERENCES usuarios(id),
  status status_operacao NOT NULL DEFAULT 'ativa',
  observacoes_operacionais TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operacoes_supervisor ON operacoes(supervisor_id);
CREATE INDEX idx_operacoes_gerente ON operacoes(gerente_operacoes_id);
CREATE INDEX idx_operacoes_status ON operacoes(status);

-- ============================================================
-- SEQUÊNCIA para PR
-- ============================================================

CREATE SEQUENCE sinistro_pr_seq START WITH 1;

-- ============================================================
-- TABELA: sinistros
-- ============================================================

CREATE TABLE sinistros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr VARCHAR(20) UNIQUE NOT NULL DEFAULT ('PR-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(NEXTVAL('sinistro_pr_seq')::TEXT, 5, '0')),
  protocolo VARCHAR(50) UNIQUE NOT NULL,
  status status_sinistro NOT NULL DEFAULT 'aberto',
  prioridade prioridade_sinistro NOT NULL DEFAULT 'media',
  criado_por_id UUID NOT NULL REFERENCES usuarios(id),
  operacao_id UUID NOT NULL REFERENCES operacoes(id),
  supervisor_id UUID NOT NULL REFERENCES usuarios(id),
  gerente_operacoes_id UUID REFERENCES usuarios(id),
  -- Cliente
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_cpf VARCHAR(14) NOT NULL,
  cliente_telefone VARCHAR(20) NOT NULL,
  cliente_email VARCHAR(255),
  -- Veículo
  veiculo_placa VARCHAR(10) NOT NULL,
  veiculo_modelo VARCHAR(100) NOT NULL,
  veiculo_marca VARCHAR(100) NOT NULL,
  -- Ocorrência
  data_ocorrencia DATE NOT NULL,
  data_emissao DATE NOT NULL,
  motivo TEXT NOT NULL,
  danos TEXT NOT NULL,
  situacao VARCHAR(100),
  observacoes TEXT,
  possui_imagens BOOLEAN NOT NULL DEFAULT FALSE,
  -- Tratativa
  analista_id UUID REFERENCES usuarios(id),
  data_inicio_analise TIMESTAMPTZ,
  obs_internas TEXT,
  -- Financeiro
  aprovado_pagamento BOOLEAN,
  data_pagamento DATE,
  obs_financeiro TEXT,
  -- Encerramento
  data_conclusao TIMESTAMPTZ,
  resultado_final TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sinistros_status ON sinistros(status);
CREATE INDEX idx_sinistros_operacao ON sinistros(operacao_id);
CREATE INDEX idx_sinistros_supervisor ON sinistros(supervisor_id);
CREATE INDEX idx_sinistros_gerente ON sinistros(gerente_operacoes_id);
CREATE INDEX idx_sinistros_criado_por ON sinistros(criado_por_id);

-- ============================================================
-- TABELA: anexos
-- ============================================================

CREATE TABLE anexos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sinistro_id UUID NOT NULL REFERENCES sinistros(id) ON DELETE CASCADE,
  categoria categoria_anexo NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  tamanho BIGINT,
  tipo_mime VARCHAR(100),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_anexos_sinistro ON anexos(sinistro_id);

-- ============================================================
-- TABELA: historico_sinistros
-- ============================================================

CREATE TABLE historico_sinistros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sinistro_id UUID NOT NULL REFERENCES sinistros(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  acao VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historico_sinistro ON historico_sinistros(sinistro_id);

-- ============================================================
-- TRIGGERS: atualizado_em
-- ============================================================

CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_atualizado_em
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_operacoes_atualizado_em
  BEFORE UPDATE ON operacoes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_sinistros_atualizado_em
  BEFORE UPDATE ON sinistros
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ============================================================
-- USUÁRIO ADMIN INICIAL
-- Senha: Admin@2024 (bcrypt hash gerado externamente)
-- Troque pela hash real após gerar com bcryptjs!
-- ============================================================

INSERT INTO usuarios (nome, email, senha_hash, perfil, status, ativo)
VALUES (
  'Administrador Leve',
  'admin@levemobilidade.com.br',
  '$2b$10$ydy2pkIye0DlxHP.lIWTPeTGAeXOe7fx15doMZzc7hqMp4PCHqP8K',
  'administrador',
  'ativo',
  TRUE
);

-- ============================================================
-- BUCKET de Storage para anexos de sinistros
-- Execute no painel Supabase > Storage > Create Bucket
-- Nome: sinistros-anexos (privado)
-- ============================================================
