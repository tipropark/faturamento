-- ============================================================
-- LEVE ERP — Módulo Automações (Catálogo e Vinculação)
-- ============================================================

-- 1. Tabela de Catálogo de Sistemas de Automação
CREATE TABLE IF NOT EXISTS public.automacoes_catalogo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    homologado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de Sistemas iniciais
INSERT INTO public.automacoes_catalogo (nome, homologado) VALUES
('PARCO', TRUE),
('CLOUDPARK CANCELA', FALSE),
('CLOUDPARK MOBILE', FALSE),
('LINK', FALSE),
('PERSONAL', FALSE),
('EMBRATEC', FALSE),
('WPS', FALSE),
('AVC', FALSE),
('NEPOS', FALSE),
('CARMOBI', FALSE)
ON CONFLICT (nome) DO UPDATE SET homologado = EXCLUDED.homologado;

-- 2. Tabela de Configuração de Automação por Operação (1:1 com operacoes)
CREATE TABLE IF NOT EXISTS public.operacoes_automacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operacao_id UUID NOT NULL UNIQUE REFERENCES public.operacoes(id) ON DELETE CASCADE,
    automacao_id UUID REFERENCES public.automacoes_catalogo(id) ON DELETE SET NULL,
    arquitetura VARCHAR(10) DEFAULT 'x64', -- x86 ou x64
    habilitar_faturamento BOOLEAN DEFAULT FALSE,
    ponto_bat TEXT,
    script_coleta TEXT,
    -- Campos extras para futura expansão
    configuracoes_adicionais JSONB DEFAULT '{}'::jsonb,
    
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_op_auto_operacao ON operacoes_automacao(operacao_id);
CREATE INDEX IF NOT EXISTS idx_op_auto_sistema ON operacoes_automacao(automacao_id);

-- Trigger para atualizado_em
CREATE OR REPLACE TRIGGER trg_operacoes_automacao_atualizado_em
  BEFORE UPDATE ON operacoes_automacao
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- 3. Limpeza da tabela operacoes (opcional, mas recomendado para migração limpa)
-- Removeremos as colunas antigas após garantir que o frontend/backend usem a nova tabela.
-- ALTER TABLE public.operacoes DROP COLUMN IF EXISTS automacao_sistema;
-- ALTER TABLE public.operacoes DROP COLUMN IF EXISTS automacao_arquitetura;
-- ALTER TABLE public.operacoes DROP COLUMN IF EXISTS habilitar_faturamento;
-- ALTER TABLE public.operacoes DROP COLUMN IF EXISTS ponto_bat;
-- ALTER TABLE public.operacoes DROP COLUMN IF EXISTS script_coleta;
