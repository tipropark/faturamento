-- ============================================================
-- LEVE ERP — Evolução: Configurações e Permissões (v2)
-- ============================================================

-- ENUM para níveis de acesso (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nivel_acesso_modulo') THEN
        CREATE TYPE nivel_acesso_modulo AS ENUM (
            'sem_acesso', 
            'visualizacao', 
            'criacao', 
            'edicao', 
            'aprovacao', 
            'execucao', 
            'total'
        );
    END IF;
END $$;

-- TABELA: configuracoes_sistema
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria VARCHAR(50) NOT NULL, -- 'google_drive', 'supabase', 'geral'
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  sensivel BOOLEAN DEFAULT FALSE,
  atualizado_por_id UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: perfis_permissoes
CREATE TABLE IF NOT EXISTS perfis_permissoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfil perfil_usuario NOT NULL,
  modulo VARCHAR(100) NOT NULL, -- 'sinistros', 'tarifarios', 'operacoes', etc.
  nivel nivel_acesso_modulo NOT NULL DEFAULT 'sem_acesso',
  atualizado_por_id UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(perfil, modulo)
);

-- TABELA: auditoria_administrativa
CREATE TABLE IF NOT EXISTS auditoria_administrativa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id),
  modulo VARCHAR(100) NOT NULL, -- 'configuracoes', 'permissoes'
  acao VARCHAR(100) NOT NULL, -- 'update_config', 'update_permission'
  descricao TEXT NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address VARCHAR(45),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers para atualizado_em
DROP TRIGGER IF EXISTS trg_config_atualizado_em ON configuracoes_sistema;
CREATE TRIGGER trg_config_atualizado_em
  BEFORE UPDATE ON configuracoes_sistema
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

DROP TRIGGER IF EXISTS trg_perfis_permissoes_atualizado_em ON perfis_permissoes;
CREATE TRIGGER trg_perfis_permissoes_atualizado_em
  BEFORE UPDATE ON perfis_permissoes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- Seed inicial de perfis/módulos

-- Módulos Sugeridos: dashboard, sinistros, tarifarios, operacoes, usuarios, configuracoes, permissoes

-- Admin
INSERT INTO perfis_permissoes (perfil, modulo, nivel) VALUES 
('administrador', 'dashboard', 'total'),
('administrador', 'sinistros', 'total'),
('administrador', 'tarifarios', 'total'),
('administrador', 'operacoes', 'total'),
('administrador', 'usuarios', 'total'),
('administrador', 'configuracoes', 'total'),
('administrador', 'permissoes', 'total')
ON CONFLICT (perfil, modulo) DO UPDATE SET nivel = 'total';

-- TI
INSERT INTO perfis_permissoes (perfil, modulo, nivel) VALUES 
('ti', 'dashboard', 'total'),
('ti', 'sinistros', 'total'),
('ti', 'tarifarios', 'execucao'),
('ti', 'operacoes', 'visualizacao'),
('ti', 'usuarios', 'visualizacao'),
('ti', 'configuracoes', 'total'),
('ti', 'permissoes', 'visualizacao')
ON CONFLICT (perfil, modulo) DO UPDATE SET nivel = EXCLUDED.nivel;

-- Diretoria
INSERT INTO perfis_permissoes (perfil, modulo, nivel) VALUES 
('diretoria', 'dashboard', 'visualizacao'),
('diretoria', 'sinistros', 'visualizacao'),
('diretoria', 'tarifarios', 'aprovacao'),
('diretoria', 'operacoes', 'visualizacao')
ON CONFLICT (perfil, modulo) DO UPDATE SET nivel = EXCLUDED.nivel;

-- Supervisor
INSERT INTO perfis_permissoes (perfil, modulo, nivel) VALUES 
('supervisor', 'dashboard', 'visualizacao'),
('supervisor', 'sinistros', 'criacao'),
('supervisor', 'tarifarios', 'criacao'),
('supervisor', 'operacoes', 'visualizacao')
ON CONFLICT (perfil, modulo) DO UPDATE SET nivel = EXCLUDED.nivel;

-- SEED: configuracoes_sistema
INSERT INTO configuracoes_sistema (categoria, chave, valor, descricao, sensivel) VALUES 
('google_drive', 'GOOGLE_CLIENT_ID', 'vazio', 'ID de Cliente da API Google Cloud', TRUE),
('google_drive', 'GOOGLE_CLIENT_SECRET', 'vazio', 'Segredo do Cliente da API Google Cloud', TRUE),
('google_drive', 'GOOGLE_REFRESH_TOKEN', 'vazio', 'Token de atualização para manter a conexão ativa', TRUE),
('google_drive', 'GOOGLE_DRIVE_FOLDER_ID', 'root', 'ID da pasta pai onde os arquivos serão salvos', FALSE),
('supabase', 'NEXT_PUBLIC_SUPABASE_URL', 'https://vazio.supabase.co', 'URL base do projeto Supabase', FALSE),
('supabase', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'vazio', 'Chave anônima para requisições de frontend', TRUE),
('supabase', 'SUPABASE_SERVICE_ROLE_KEY', 'vazio', 'Chave de serviço para operações administrativas (Backend Only)', TRUE)
ON CONFLICT (chave) DO NOTHING;
