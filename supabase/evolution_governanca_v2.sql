-- EVOLUÇÃO GOVERNANÇA DE ACESSOS V2 (Perfis, Módulos e Escopo)

-- 1. Tabela de Módulos do Sistema (Dinamismo de Matrix)
CREATE TABLE IF NOT EXISTS modulos_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identificador TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT DEFAULT 'Geral',
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    visivel_menu BOOLEAN DEFAULT TRUE,
    participa_matriz BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Perfis do Sistema (Substitui Enum por Dados)
CREATE TABLE IF NOT EXISTS perfis_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identificador TEXT UNIQUE NOT NULL, -- Ex: 'administrador', 'ti', 'financeiro_senior'
    nome TEXT NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'ativo', -- 'ativo', 'inativo'
    eh_modelo BOOLEAN DEFAULT FALSE,
    perfil_base_id UUID REFERENCES perfis_sistema(id),
    criado_por_id UUID REFERENCES usuarios(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_por_id UUID REFERENCES usuarios(id),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Evolução da Tabela de Permissões (vínculo com UUID se possível, mas mantendo identificador para compatibilidade)
ALTER TABLE perfis_permissoes ADD COLUMN IF NOT EXISTS escopo TEXT DEFAULT 'global'; -- 'global', 'restrito'
ALTER TABLE perfis_permissoes ADD COLUMN IF NOT EXISTS operacoes_permitidas UUID[]; -- Array de IDs de operações
ALTER TABLE perfis_permissoes ADD COLUMN IF NOT EXISTS unidades_permitidas UUID[]; -- Para expansão futura

-- 4. Seed: Módulos Atuais
INSERT INTO modulos_sistema (identificador, nome, categoria, ordem) VALUES 
('dashboard', 'Dashboard / Painel Inicial', 'Geral', 1),
('sinistros', 'Módulo de Sinistros', 'Operacional', 2),
('tarifarios', 'Tarifários e Convênios', 'Operacional', 3),
('operacoes', 'Gestão de Operações', 'Administrativo', 4),
('usuarios', 'Gestão de Usuários', 'Administrativo', 5),
('configuracoes', 'Configurações de Infraestrutura', 'TI', 6),
('permissoes', 'Controle de Acessos', 'TI', 7)
ON CONFLICT (identificador) DO UPDATE SET 
    nome = EXCLUDED.nome,
    categoria = EXCLUDED.categoria,
    ordem = EXCLUDED.ordem;

-- 5. Seed: Perfis Existentes (Conversão do Enum para Tabela)
INSERT INTO perfis_sistema (identificador, nome) VALUES 
('administrador', 'Administrador'),
('diretoria', 'Diretoria'),
('gerente_operacoes', 'Gerente de Operações'),
('supervisor', 'Supervisor'),
('analista_sinistro', 'Analista de Sinistro'),
('financeiro', 'Financeiro'),
('rh', 'RH'),
('dp', 'DP'),
('auditoria', 'Auditoria'),
('ti', 'TI'),
('administrativo', 'Administrativo')
ON CONFLICT (identificador) DO NOTHING;

-- 6. Seed: Marcar alguns perfis como Modelos Iniciais
UPDATE perfis_sistema SET eh_modelo = TRUE WHERE identificador IN ('supervisor', 'ti', 'diretoria', 'financeiro');

-- 7. Trigger para data de atualização em perfis_sistema
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_perfis_sistema_updated_at
    BEFORE UPDATE ON perfis_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
