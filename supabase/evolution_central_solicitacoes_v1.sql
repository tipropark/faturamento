-- ============================================================
-- LEVE ERP — Central de Solicitações
-- Evolution v1
-- ============================================================

-- 1. TABELA: central_departamentos
CREATE TABLE central_departamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INTEGER NOT NULL DEFAULT 0,
  icone VARCHAR(50),
  cor VARCHAR(20),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA: central_status
CREATE TABLE central_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  cor VARCHAR(20),
  ordem INTEGER NOT NULL DEFAULT 0,
  finaliza_solicitacao BOOLEAN NOT NULL DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA: central_prioridades
CREATE TABLE central_prioridades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  cor VARCHAR(20),
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA: central_categorias
CREATE TYPE obrigatoriedade_operacao AS ENUM ('obrigatoria', 'opcional', 'dispensada');

CREATE TABLE central_categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  departamento_id UUID NOT NULL REFERENCES central_departamentos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INTEGER NOT NULL DEFAULT 0,
  exige_operacao obrigatoriedade_operacao NOT NULL DEFAULT 'opcional',
  permite_anexo BOOLEAN NOT NULL DEFAULT TRUE,
  sla_primeira_resposta_horas INTEGER,
  sla_conclusao_horas INTEGER,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA: central_subcategorias
CREATE TABLE central_subcategorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID NOT NULL REFERENCES central_categorias(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABELA: central_campos_dinamicos
CREATE TYPE tipo_campo_dinamico AS ENUM (
  'texto_curto', 'texto_longo', 'select', 'multiselect', 'data', 'numero', 'checkbox', 'upload', 'vinculo_operacao', 'vinculo_usuario'
);

CREATE TABLE central_campos_dinamicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  departamento_id UUID REFERENCES central_departamentos(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES central_categorias(id) ON DELETE CASCADE,
  nome_uuid VARCHAR(100) NOT NULL, -- UUID para identificação no JSON/Schema
  label VARCHAR(255) NOT NULL,
  tipo tipo_campo_dinamico NOT NULL,
  configuracoes JSONB, -- Opções para select, multiselect, etc.
  obrigatorio BOOLEAN NOT NULL DEFAULT FALSE,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA: central_solicitacoes
CREATE SEQUENCE central_solicitacoes_protocolo_seq START WITH 1000;

CREATE TABLE central_solicitacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocolo VARCHAR(20) UNIQUE NOT NULL DEFAULT ('SOL-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || NEXTVAL('central_solicitacoes_protocolo_seq')::TEXT),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  departamento_id UUID NOT NULL REFERENCES central_departamentos(id),
  categoria_id UUID NOT NULL REFERENCES central_categorias(id),
  subcategoria_id UUID REFERENCES central_subcategorias(id),
  solicitante_id UUID NOT NULL REFERENCES usuarios(id),
  operacao_id UUID REFERENCES operacoes(id), -- Nullable conforme regra 1.3
  status_id UUID NOT NULL REFERENCES central_status(id),
  prioridade_id UUID NOT NULL REFERENCES central_prioridades(id),
  responsavel_id UUID REFERENCES usuarios(id),
  
  -- SLA
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_primeira_resposta TIMESTAMPTZ,
  data_limite_primeira_resposta TIMESTAMPTZ,
  data_limite_conclusao TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  
  -- Avaliação
  nota_avaliacao INTEGER CHECK (nota_avaliacao >= 1 AND nota_avaliacao <= 5),
  comentario_avaliacao TEXT,
  
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABELA: central_campos_valores
CREATE TABLE central_campos_valores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID NOT NULL REFERENCES central_solicitacoes(id) ON DELETE CASCADE,
  campo_id UUID NOT NULL REFERENCES central_campos_dinamicos(id),
  valor TEXT, -- Armazena como texto ou JSON stringified
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABELA: central_interacoes
CREATE TYPE tipo_interacao_central AS ENUM ('mensagem', 'status_change', 'responsible_change', 'file_upload', 'conclusion', 'reopening', 'system_log');

CREATE TABLE central_interacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID NOT NULL REFERENCES central_solicitacoes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo tipo_interacao_central NOT NULL DEFAULT 'mensagem',
  conteudo TEXT,
  metadados JSONB, -- Para armazenar extras como ID do anexo, status anterior/novo, etc.
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABELA: central_anexos
CREATE TABLE central_anexos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID NOT NULL REFERENCES central_solicitacoes(id) ON DELETE CASCADE,
  interacao_id UUID REFERENCES central_interacoes(id),
  nome_arquivo VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  tamanho BIGINT,
  tipo_mime VARCHAR(100),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABELA: central_departamentos_responsaveis
CREATE TABLE central_departamentos_responsaveis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  departamento_id UUID NOT NULL REFERENCES central_departamentos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  eh_gestor BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(departamento_id, usuario_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_cs_depto ON central_solicitacoes(departamento_id);
CREATE INDEX idx_cs_cat ON central_solicitacoes(categoria_id);
CREATE INDEX idx_cs_status ON central_solicitacoes(status_id);
CREATE INDEX idx_cs_prioridade ON central_solicitacoes(prioridade_id);
CREATE INDEX idx_cs_solicitante ON central_solicitacoes(solicitante_id);
CREATE INDEX idx_cs_responsavel ON central_solicitacoes(responsavel_id);
CREATE INDEX idx_cs_operacao ON central_solicitacoes(operacao_id);
CREATE INDEX idx_cs_abertura ON central_solicitacoes(data_abertura);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER trg_central_depto_updated_at
  BEFORE UPDATE ON central_departamentos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_central_cat_updated_at
  BEFORE UPDATE ON central_categorias
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_central_subcat_updated_at
  BEFORE UPDATE ON central_subcategorias
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_central_solicitacao_updated_at
  BEFORE UPDATE ON central_solicitacoes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ============================================================
-- SEEDS INICIAIS
-- ============================================================

-- Status
INSERT INTO central_status (nome, slug, cor, ordem, finaliza_solicitacao) VALUES
('Novo', 'novo', '#3B82F6', 1, FALSE),
('Em Triagem', 'em_triagem', '#F59E0B', 2, FALSE),
('Em Atendimento', 'em_atendimento', '#8B5CF6', 3, FALSE),
('Aguardando Solicitante', 'aguardando_solicitante', '#EF4444', 4, FALSE),
('Concluído', 'concluido', '#10B981', 5, TRUE),
('Cancelado', 'cancelado', '#6B7280', 6, TRUE);

-- Prioridades
INSERT INTO central_prioridades (nome, slug, cor, ordem) VALUES
('Baixa', 'baixa', '#10B981', 1),
('Normal', 'normal', '#3B82F6', 2),
('Alta', 'alta', '#F59E0B', 3),
('Urgente', 'urgente', '#EF4444', 4);

-- Departamentos Exemplo
INSERT INTO central_departamentos (nome, descricao, ordem, cor, icone) VALUES
('TI', 'Suporte Técnico e Infraestrutura', 1, '#2563EB', 'Monitor'),
('RH', 'Recursos Humanos', 2, '#DB2777', 'Users'),
('Financeiro', 'Gestão Financeira e Contas', 3, '#059669', 'DollarSign'),
('Operações', 'Suporte às Operações de Campo', 4, '#D97706', 'Truck');
