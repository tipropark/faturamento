-- LEVE ERP — Evolução: Módulo Metas de Faturamento (MVP)
-- Versão: 1.0 | Março/2026

-- 1. TABELA: metas_faturamento
-- Cadastro da meta mensal (consolidada ou por unidade)
CREATE TABLE IF NOT EXISTS public.metas_faturamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operacao_id UUID NULL REFERENCES public.operacoes(id), -- NULL para meta global
    tipo_meta VARCHAR(20) NOT NULL DEFAULT 'operacao', -- 'operacao' | 'global'
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    valor_meta NUMERIC(14,2) NOT NULL CHECK (valor_meta >= 0),
    percentual_tolerancia NUMERIC(5,2) NULL DEFAULT 5.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ativa', -- 'ativa' | 'inativa' | 'cancelada'
    observacoes TEXT NULL,
    criado_por_id UUID NULL REFERENCES public.usuarios(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraint: uma meta por operação por mês/ano
    CONSTRAINT unq_meta_operacao_periodo UNIQUE (operacao_id, ano, mes),
    -- Constraint: se global, operacao_id deve ser NULL
    CONSTRAINT chk_meta_global_null CHECK (
        (tipo_meta = 'global' AND operacao_id IS NULL) OR 
        (tipo_meta = 'operacao' AND operacao_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_metas_operacao ON public.metas_faturamento(operacao_id);
CREATE INDEX IF NOT EXISTS idx_metas_periodo ON public.metas_faturamento(ano, mes);

-- 2. TABELA: metas_faturamento_apuracoes
-- Snapshot da situação da meta em um dado momento
CREATE TABLE IF NOT EXISTS public.metas_faturamento_apuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meta_id UUID NOT NULL REFERENCES public.metas_faturamento(id),
    operacao_id UUID NULL REFERENCES public.operacoes(id),
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    valor_meta NUMERIC(14,2) NOT NULL,
    valor_realizado NUMERIC(14,2) NOT NULL DEFAULT 0,
    valor_projetado NUMERIC(14,2) NULL,
    desvio_valor NUMERIC(14,2) NOT NULL DEFAULT 0,
    percentual_atingimento NUMERIC(7,2) NULL,
    status_apuracao VARCHAR(30) NOT NULL, -- 'meta_atingida' | 'meta_nao_atingida' | 'meta_em_risco' | 'apuracao_inconclusiva'
    confianca_apuracao VARCHAR(20) NOT NULL DEFAULT 'alta', -- 'alta' | 'media' | 'baixa'
    ultima_sincronizacao_em TIMESTAMPTZ NULL,
    apurado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apuracoes_meta ON public.metas_faturamento_apuracoes(meta_id);
CREATE INDEX IF NOT EXISTS idx_apuracoes_operacao ON public.metas_faturamento_apuracoes(operacao_id);

-- 3. TABELA: metas_faturamento_alertas
-- Alertas gerados automaticamente ou manualmente
CREATE TABLE IF NOT EXISTS public.metas_faturamento_alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meta_id UUID NOT NULL REFERENCES public.metas_faturamento(id),
    apuracao_id UUID NULL REFERENCES public.metas_faturamento_apuracoes(id),
    operacao_id UUID NULL REFERENCES public.operacoes(id),
    tipo_alerta VARCHAR(40) NOT NULL, -- 'nao_atingimento' | 'risco_nao_atingimento' | 'apuracao_inconclusiva'
    criticidade VARCHAR(20) NOT NULL, -- 'baixa' | 'media' | 'alta' | 'critica'
    status VARCHAR(20) NOT NULL DEFAULT 'aberto', -- 'aberto' | 'em_analise' | 'encaminhado_auditoria' | 'concluido' | 'cancelado'
    motivo_preliminar TEXT NULL,
    gerado_automaticamente BOOLEAN NOT NULL DEFAULT true,
    gerado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alertas_operacao ON public.metas_faturamento_alertas(operacao_id);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON public.metas_faturamento_alertas(status);

-- 4. TABELA: metas_faturamento_tratativas
-- Fluxo de tratamento pela auditoria
CREATE TABLE IF NOT EXISTS public.metas_faturamento_tratativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alerta_id UUID NOT NULL REFERENCES public.metas_faturamento_alertas(id),
    operacao_id UUID NULL REFERENCES public.operacoes(id),
    auditor_responsavel_id UUID NULL REFERENCES public.usuarios(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- 'pendente' | 'em_analise' | 'concluida' | 'sem_procedencia'
    categoria_causa VARCHAR(50) NULL, -- 'queda_movimento' | 'despesa_elevada' | 'falha_sincronizacao' | 'inconsistencia_dados' | 'erro_operacional' | 'outros'
    descricao_analise TEXT NULL,
    causa_raiz TEXT NULL,
    acao_corretiva TEXT NULL,
    parecer_final TEXT NULL,
    concluida_em TIMESTAMPTZ NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tratativas_alerta ON public.metas_faturamento_tratativas(alerta_id);
CREATE INDEX IF NOT EXISTS idx_tratativas_auditor ON public.metas_faturamento_tratativas(auditor_responsavel_id);

-- 5. ATIVAÇÃO DA AUDITORIA AUTOMÁTICA
-- Adicionar triggers de auditoria do sistema para as novas tabelas
DO $$ BEGIN
    CALL sp_ativar_auditoria_tabela('metas_faturamento');
    CALL sp_ativar_auditoria_tabela('metas_faturamento_apuracoes');
    CALL sp_ativar_auditoria_tabela('metas_faturamento_alertas');
    CALL sp_ativar_auditoria_tabela('metas_faturamento_tratativas');
END $$;

-- 6. REGISTRO DO MÓDULO NO CATÁLOGO DO SISTEMA
INSERT INTO public.modulos_sistema (identificador, nome, categoria, ordem)
VALUES ('metas_faturamento', 'Metas e Alertas de Faturamento', 'Operacional', 8)
ON CONFLICT (identificador) DO UPDATE SET 
    nome = EXCLUDED.nome,
    categoria = EXCLUDED.categoria,
    ordem = EXCLUDED.ordem;

-- 7. DISPARAR RELOAD DO SCHEMA PARA O POSTGREST (Supabase)
NOTIFY pgrst, 'reload schema';
