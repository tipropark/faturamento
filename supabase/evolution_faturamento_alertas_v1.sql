-- 1. Calendário de Funcionamento por Operação
CREATE TABLE IF NOT EXISTS faturamento_operacao_calendario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id UUID NOT NULL REFERENCES operacoes(id) ON DELETE CASCADE,
    domingo BOOLEAN DEFAULT TRUE,
    segunda BOOLEAN DEFAULT TRUE,
    terca BOOLEAN DEFAULT TRUE,
    quarta BOOLEAN DEFAULT TRUE,
    quinta BOOLEAN DEFAULT TRUE,
    sexta BOOLEAN DEFAULT TRUE,
    sabado BOOLEAN DEFAULT TRUE,
    criado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(operacao_id)
);

-- 2. Tabela de Feriados
CREATE TABLE IF NOT EXISTS faturamento_feriados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    abrangencia VARCHAR(50) DEFAULT 'nacional', -- 'nacional', 'regional', 'operacao'
    operacao_id UUID REFERENCES operacoes(id) ON DELETE CASCADE, -- Opcional
    criado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(data, operacao_id)
);

-- 3. Regras de Alerta (Configuração)
CREATE TABLE IF NOT EXISTS faturamento_regras_alerta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL, 
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    severidade VARCHAR(20) DEFAULT 'insight', -- 'insight', 'alerta', 'critico'
    score_base INTEGER DEFAULT 10,
    habilitada BOOLEAN DEFAULT TRUE,
    parametros JSONB DEFAULT '{}',
    criado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Alertas de Metas (Instâncias)
CREATE TABLE IF NOT EXISTS faturamento_alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id UUID NOT NULL REFERENCES operacoes(id) ON DELETE CASCADE,
    data_referencia DATE NOT NULL,
    regra_id UUID NOT NULL REFERENCES faturamento_regras_alerta(id),
    severidade VARCHAR(20) NOT NULL,
    score INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'analisado', 'justificado', 'falso_positivo'
    justificativa TEXT,
    resumo VARCHAR(255),
    detalhes JSONB, 
    suprimido BOOLEAN DEFAULT FALSE,
    motivo_supressao TEXT,
    criado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Feedback da Auditoria
CREATE TABLE IF NOT EXISTS faturamento_alertas_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alerta_id UUID NOT NULL REFERENCES faturamento_alertas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    acao VARCHAR(50) NOT NULL, 
    comentario TEXT,
    criado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir Regras Iniciais
INSERT INTO faturamento_regras_alerta (codigo, nome, descricao, severidade, score_base, parametros)
VALUES 
('DIA_ZERADO', 'Faturamento Zerado Inesperado', 'Detecta dias com faturamento zero em dias que a operação deveria funcionar.', 'critico', 50, '{"min_historico_dias": 7}'),
('SEQUENCIA_ABAIXO_META', 'Sequência Abaixo da Meta', 'Detecta 3 dias consecutivos ou mais abaixo da meta definida.', 'alerta', 30, '{"dias_consecutivos": 3}'),
('QUEDA_BRUSCA_HISTORICA', 'Queda Brusca vs Histórico', 'Detecta queda maior que 35% comparada à média do mesmo dia da semana.', 'alerta', 25, '{"percentual_queda": 35}'),
('DESVIO_META_DIARIA', 'Desvio Acima do Limite', 'Detecta desvio maior que 25% da meta diária.', 'insight', 15, '{"percentual_desvio": 25}');
