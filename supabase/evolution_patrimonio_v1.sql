-- Evolution: Patrimonio V1
-- Descrição: Tabelas, enums e triggers para o módulo de Patrimônio

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE categoria_patrimonio AS ENUM ('TI', 'Facilities', 'Operacional', 'Veículo', 'Mobiliário', 'Outros');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_patrimonio AS ENUM ('Ativo', 'Estoque', 'Manutenção', 'Emprestado', 'Baixado', 'Extraviado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE condicao_patrimonio AS ENUM ('Excelente', 'Bom', 'Regular', 'Ruim', 'Inoperante');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABELAS

-- patrimonios (Mestre)
CREATE TABLE IF NOT EXISTS patrimonios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_patrimonio VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria categoria_patrimonio NOT NULL,
    status status_patrimonio NOT NULL DEFAULT 'Estoque',
    operacao_id UUID NOT NULL REFERENCES operacoes(id),
    responsavel_id UUID REFERENCES usuarios(id),
    valor_compra NUMERIC(15, 2),
    data_compra DATE,
    data_garantia DATE,
    campos_especificos JSONB DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- patrimonio_movimentacoes (Histórico de Alocação)
CREATE TABLE IF NOT EXISTS patrimonio_movimentacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patrimonio_id UUID NOT NULL REFERENCES patrimonios(id) ON DELETE CASCADE,
    operacao_origem_id UUID REFERENCES operacoes(id),
    operacao_destino_id UUID NOT NULL REFERENCES operacoes(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    data_movimentacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    motivo TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- patrimonio_manutencoes (Eventos Técnicos)
CREATE TABLE IF NOT EXISTS patrimonio_manutencoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patrimonio_id UUID NOT NULL REFERENCES patrimonios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- Preventiva, Corretiva, Calibração
    status VARCHAR(50) NOT NULL DEFAULT 'Agendada', -- Agendada, Em Curso, Concluída, Cancelada
    descricao TEXT,
    custo NUMERIC(15, 2),
    data_inicio DATE,
    data_fim DATE,
    prestador_servico VARCHAR(255),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- patrimonio_vistorias (Checklists / Inspeções)
CREATE TABLE IF NOT EXISTS patrimonio_vistorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patrimonio_id UUID NOT NULL REFERENCES patrimonios(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    data_vistoria TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    condicao_geral condicao_patrimonio NOT NULL,
    observacoes TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- patrimonio_anexos (Documentação e Fotos)
CREATE TABLE IF NOT EXISTS patrimonio_anexos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patrimonio_id UUID NOT NULL REFERENCES patrimonios(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(100), -- image/jpeg, application/pdf
    categoria_anexo VARCHAR(50), -- NF-e, Foto, Manual, TermoResponsabilidade
    criado_por_id UUID REFERENCES usuarios(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- patrimonio_alertas (Monitoramento)
CREATE TABLE IF NOT EXISTS patrimonio_alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patrimonio_id UUID NOT NULL REFERENCES patrimonios(id) ON DELETE CASCADE,
    tipo_alerta VARCHAR(50) NOT NULL, -- Garantia, Manutenção, Vistoria
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente', -- Pendente, Resolvido, Ignorado
    descricao TEXT,
    data_alerta DATE NOT NULL DEFAULT CURRENT_DATE,
    resolvido_em TIMESTAMPTZ,
    resolvido_por_id UUID REFERENCES usuarios(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_patrimonio_operacao ON patrimonios(operacao_id);
CREATE INDEX IF NOT EXISTS idx_patrimonio_status ON patrimonios(status);
CREATE INDEX IF NOT EXISTS idx_patrimonio_codigo ON patrimonios(codigo_patrimonio);
CREATE INDEX IF NOT EXISTS idx_patrimonio_mov_patrimonio ON patrimonio_movimentacoes(patrimonio_id);
CREATE INDEX IF NOT EXISTS idx_patrimonio_manut_patrimonio ON patrimonio_manutencoes(patrimonio_id);
CREATE INDEX IF NOT EXISTS idx_patrimonio_vist_patrimonio ON patrimonio_vistorias(patrimonio_id);

-- 4. TRIGGERS (atualizado_em)
CREATE TRIGGER update_patrimonios_atualizado_em
    BEFORE UPDATE ON patrimonios
    FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER update_patrimonio_manutencoes_atualizado_em
    BEFORE UPDATE ON patrimonio_manutencoes
    FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- 5. AUDITORIA GLOBAL (v2)
-- A procedure sp_ativar_auditoria_tabela já existe no sistema (evolution_auditoria_v2_global.sql)
CALL sp_ativar_auditoria_tabela('patrimonios');
CALL sp_ativar_auditoria_tabela('patrimonio_movimentacoes');
CALL sp_ativar_auditoria_tabela('patrimonio_manutencoes');
CALL sp_ativar_auditoria_tabela('patrimonio_vistorias');
CALL sp_ativar_auditoria_tabela('patrimonio_anexos');
CALL sp_ativar_auditoria_tabela('patrimonio_alertas');

-- 6. RLS (Row Level Security) - Opcional se for controlado via API, mas recomendado
ALTER TABLE patrimonios ENABLE ROW LEVEL SECURITY;
-- Políticas seriam adicionadas aqui futuramente se necessário direto no DB
