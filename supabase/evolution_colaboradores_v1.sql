-- Evolution: Colaboradores V1
-- Descrição: Tabelas de colaboradores e relacionamento com operações

-- 1. ENUMS ESPECÍFICOS
DO $$ BEGIN
    CREATE TYPE status_colaborador AS ENUM ('ativo', 'afastado', 'ferias', 'desligado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_vinculo_colaborador AS ENUM ('CLT', 'PJ', 'Mei', 'Estágio', 'Temporário', 'Terceirizado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABELAS

-- colaboradores (Cadastro Mestre)
CREATE TABLE IF NOT EXISTS colaboradores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    matricula VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cargo VARCHAR(100),
    departamento VARCHAR(100),
    tipo_vinculo tipo_vinculo_colaborador NOT NULL DEFAULT 'CLT',
    status status_colaborador NOT NULL DEFAULT 'ativo',
    data_admissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_desligamento DATE,
    usuario_id UUID UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL,
    observacoes TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- colaboradores_operacoes (Relacionamento N:N com Operações)
CREATE TABLE IF NOT EXISTS colaboradores_operacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
    operacao_id UUID NOT NULL REFERENCES operacoes(id) ON DELETE CASCADE,
    funcao_operacao VARCHAR(100), -- Função específica nesta operação
    responsavel_principal BOOLEAN NOT NULL DEFAULT FALSE, -- Se é o contato principal da operação
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim DATE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Impedir vínculos ativos duplicados para o mesmo colaborador na mesma operação
    CONSTRAINT unique_vínculo_ativo_colaborador_operacao UNIQUE NULLS NOT DISTINCT (colaborador_id, operacao_id, ativo)
);

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_colaboradores_nome ON colaboradores(nome);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cpf ON colaboradores(cpf);
CREATE INDEX IF NOT EXISTS idx_colaboradores_status ON colaboradores(status);
CREATE INDEX IF NOT EXISTS idx_colaboradores_usuario ON colaboradores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_col_op_colaborador ON colaboradores_operacoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_col_op_operacao ON colaboradores_operacoes(operacao_id);
CREATE INDEX IF NOT EXISTS idx_col_op_ativo ON colaboradores_operacoes(ativo);

-- 4. TRIGGERS (atualizado_em)
CREATE TRIGGER update_colaboradores_atualizado_em
    BEFORE UPDATE ON colaboradores
    FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER update_colaboradores_operacoes_atualizado_em
    BEFORE UPDATE ON colaboradores_operacoes
    FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- 5. AUDITORIA GLOBAL (v2)
CALL sp_ativar_auditoria_tabela('colaboradores');
CALL sp_ativar_auditoria_tabela('colaboradores_operacoes');

-- 6. RLS (Row Level Security)
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores_operacoes ENABLE ROW LEVEL SECURITY;

-- Nota: Políticas de segurança são aplicadas via src/lib/permissions.ts nas APIs.
