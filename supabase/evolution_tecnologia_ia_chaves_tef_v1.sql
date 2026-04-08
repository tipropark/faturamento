-- ============================================================
-- LEVE ERP — Módulo Automações / Tecnologia & IA
-- Criação da Tabela de Chaves TEF
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tecnologia_ia_chaves_tef (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operacao_id UUID NOT NULL REFERENCES public.operacoes(id) ON DELETE CASCADE,
    automacao_id UUID REFERENCES public.automacoes_catalogo(id) ON DELETE SET NULL,
    chave VARCHAR(100) NOT NULL,
    concentrador VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ATIVO', -- ATIVO, INATIVO, BLOQUEADO, TESTE
    observacao TEXT,
    
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chaves_tef_operacao ON public.tecnologia_ia_chaves_tef(operacao_id);
CREATE INDEX IF NOT EXISTS idx_chaves_tef_automacao ON public.tecnologia_ia_chaves_tef(automacao_id);

-- Trigger para atualizado_em
CREATE OR REPLACE TRIGGER trg_tecnologia_ia_chaves_tef_atualizado_em
  BEFORE UPDATE ON public.tecnologia_ia_chaves_tef
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
