-- ============================================================
-- LEVE ERP — EVOLUÇÃO FATURAMENTO V8 (Resumo Personal)
-- ============================================================

-- 1. Adicionar campo para diferenciar o modo de integração na operação
ALTER TABLE public.operacoes 
ADD COLUMN IF NOT EXISTS faturamento_modo_integracao VARCHAR(50) DEFAULT 'movimentos_detalhados';

COMMENT ON COLUMN public.operacoes.faturamento_modo_integracao IS 'Define se a operação importa movimentos brutos ou resumo diário consolidado (PERSONAL)';

-- 2. Criar tabela de staging para resumos importados
CREATE TABLE IF NOT EXISTS public.faturamento_resumo_importado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operacao_id UUID NOT NULL REFERENCES public.operacoes(id) ON DELETE CASCADE,
    data_referencia DATE NOT NULL,
    origem_sistema VARCHAR(50) NOT NULL DEFAULT 'PERSONAL',
    schema_version VARCHAR(20) null,
    agent_version VARCHAR(20) null,
    integration_type VARCHAR(50) null,
    
    -- Valores brutos vindos do sistema de origem
    total_receita_original NUMERIC(15,2) DEFAULT 0,
    total_avulso_original NUMERIC(15,2) DEFAULT 0,
    total_mensalista_original NUMERIC(15,2) DEFAULT 0,
    total_geral NUMERIC(15,2) DEFAULT 0,
    
    -- Detalhamento JSON
    resumo_por_tipo_json JSONB DEFAULT '{}',
    resumo_por_forma_pagamento_json JSONB DEFAULT '{}',
    
    -- Rastreabilidade
    payload_original JSONB NOT NULL,
    hash_lote VARCHAR(255) NULL,
    status_importacao VARCHAR(30) DEFAULT 'processado',
    mensagem_processamento TEXT NULL,
    
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint de unicidade para garantir idempotência por Operação/Data/Origem
    CONSTRAINT unique_resumo_op_data_origem UNIQUE (operacao_id, data_referencia, origem_sistema)
);

-- 3. Ativar trigger de timestamp para a nova tabela
DROP TRIGGER IF EXISTS trg_faturamento_resumo_importado_atualizado_em ON public.faturamento_resumo_importado;
CREATE TRIGGER trg_faturamento_resumo_importado_atualizado_em
    BEFORE UPDATE ON public.faturamento_resumo_importado
    FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- 4. Índices para performance de consulta e auditoria
CREATE INDEX IF NOT EXISTS idx_resumo_importado_op ON public.faturamento_resumo_importado(operacao_id);
CREATE INDEX IF NOT EXISTS idx_resumo_importado_data ON public.faturamento_resumo_importado(data_referencia);

-- 5. Ativar Auditoria (Padrão do Projeto)
DO $$ 
BEGIN
    -- Utilizando a procedure padrão do projeto se disponível
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sp_ativar_auditoria_tabela') THEN
        CALL sp_ativar_auditoria_tabela('faturamento_resumo_importado');
    END IF;
END $$;

-- 6. Atualizar a função de reprocessamento para suportar o modo 'personal_resumo_diario'
CREATE OR REPLACE FUNCTION public.reprocessar_faturamento_dia(p_operacao_id UUID, p_data DATE)
RETURNS VOID AS $$
DECLARE
    v_modo_integracao VARCHAR(50);
    
    v_orig_receita NUMERIC(15,2) := 0;
    v_orig_despesa NUMERIC(15,2) := 0;
    v_orig_avulso NUMERIC(15,2) := 0;
    v_orig_mensalista NUMERIC(15,2) := 0;
    v_orig_count INTEGER := 0;
    
    v_ajuste_receita NUMERIC(15,2) := 0;
    v_ajuste_despesa NUMERIC(15,2) := 0;
    v_ajuste_avulso NUMERIC(15,2) := 0;
    v_ajuste_mensalista NUMERIC(15,2) := 0;
    
    v_json_tipo JSONB;
    v_json_forma JSONB;
    v_last_import TIMESTAMPTZ;
BEGIN
    -- Verificar o modo de integração da operação
    SELECT COALESCE(faturamento_modo_integracao, 'movimentos_detalhados') INTO v_modo_integracao
    FROM public.operacoes WHERE id = p_operacao_id;

    IF v_modo_integracao = 'personal_resumo_diario' THEN
        -- 3.1a Capturar do resumo importado (Trilha Personal)
        -- Nota: No Personal, total_receita_original costuma ser a soma total.
        -- Para evitar duplicidade na soma do Dashboard (que faz Receita + Avulso + Mensalista),
        -- calculamos a 'v_orig_receita' (genérica) como o que sobra.
        SELECT 
            GREATEST(0, total_receita_original - (total_avulso_original + total_mensalista_original)), 
            0, 
            total_avulso_original, 
            total_mensalista_original, 
            0, 
            atualizado_em,
            resumo_por_tipo_json,
            resumo_por_forma_pagamento_json
        INTO 
            v_orig_receita, v_orig_despesa, v_orig_avulso, v_orig_mensalista, 
            v_orig_count, v_last_import, v_json_tipo, v_json_forma
        FROM public.faturamento_resumo_importado
        WHERE operacao_id = p_operacao_id AND data_referencia = p_data;

        -- Transformar formato FLAT (Personal) para format ESTRUTURADO (Dashboard espera {"total": X, "count": Y})
        IF v_json_tipo IS NOT NULL AND jsonb_typeof(v_json_tipo) = 'object' THEN
            SELECT jsonb_object_agg(key, jsonb_build_object('total', (value)::numeric, 'count', 0))
            INTO v_json_tipo
            FROM jsonb_each_text(v_json_tipo);
        END IF;

        IF v_json_forma IS NOT NULL AND jsonb_typeof(v_json_forma) = 'object' THEN
            SELECT jsonb_object_agg(key, jsonb_build_object('total', (value)::numeric, 'count', 0))
            INTO v_json_forma
            FROM jsonb_each_text(v_json_forma);
        END IF;
    ELSE
        -- 3.1b Capturar totais originais dos movimentos (Trilha Padrão)
        SELECT 
            SUM(CASE WHEN tipo_movimento = 'Receita' THEN valor ELSE 0 END),
            SUM(CASE WHEN tipo_movimento = 'Despesa' THEN valor ELSE 0 END),
            SUM(CASE WHEN tipo_movimento = 'Avulso' THEN valor ELSE 0 END),
            SUM(CASE WHEN tipo_movimento = 'Mensalista' THEN valor ELSE 0 END),
            COUNT(*),
            MAX(data_importacao)
        INTO 
            v_orig_receita, v_orig_despesa, v_orig_avulso, v_orig_mensalista, v_orig_count, v_last_import
        FROM public.faturamento_movimentos
        WHERE operacao_id = p_operacao_id 
          AND (data_saida::DATE = p_data OR (data_saida IS NULL AND criado_em::DATE = p_data));

        -- Compatibilidade de tipos
        IF v_orig_receita IS NULL AND v_orig_despesa IS NOT NULL THEN
           SELECT SUM(CASE WHEN tipo_movimento NOT IN ('Despesa', 'Avulso', 'Mensalista') THEN valor ELSE 0 END) 
           INTO v_orig_receita 
           FROM public.faturamento_movimentos 
           WHERE operacao_id = p_operacao_id AND (data_saida::DATE = p_data OR (data_saida IS NULL AND criado_em::DATE = p_data));
        END IF;
        
        -- Construir JSONs na trilha padrão
        SELECT 
            jsonb_object_agg(tipo_movimento, json_build_object('total', total, 'count', qtde)) FILTER (WHERE tipo_movimento IS NOT NULL)
        INTO v_json_tipo
        FROM (
            SELECT tipo_movimento, SUM(valor) as total, COUNT(*) as qtde
            FROM public.faturamento_movimentos 
            WHERE operacao_id = p_operacao_id 
              AND (data_saida::DATE = p_data OR (data_saida IS NULL AND criado_em::DATE = p_data))
            GROUP BY tipo_movimento
        ) t;

        SELECT 
            jsonb_object_agg(forma_pagamento, json_build_object('total', total, 'count', qtde)) FILTER (WHERE forma_pagamento IS NOT NULL)
        INTO v_json_forma
        FROM (
            SELECT COALESCE(forma_pagamento, 'OUTROS') as forma_pagamento, SUM(valor) as total, COUNT(*) as qtde
            FROM public.faturamento_movimentos 
            WHERE operacao_id = p_operacao_id 
              AND (data_saida::DATE = p_data OR (data_saida IS NULL AND criado_em::DATE = p_data))
            GROUP BY forma_pagamento
        ) f;
    END IF;

    -- 3.2 Capturar totais de ajustes aprovados (Comum a ambos os fluxos)
    SELECT 
        SUM(CASE WHEN tipo_ajuste = 'Receita' THEN valor * sinal ELSE 0 END),
        SUM(CASE WHEN tipo_ajuste = 'Despesa' THEN valor * sinal ELSE 0 END),
        SUM(CASE WHEN tipo_ajuste = 'Avulso' THEN valor * sinal ELSE 0 END),
        SUM(CASE WHEN tipo_ajuste = 'Mensalista' THEN valor * sinal ELSE 0 END)
    INTO 
        v_ajuste_receita, v_ajuste_despesa, v_ajuste_avulso, v_ajuste_mensalista
    FROM public.faturamento_ajustes
    WHERE operacao_id = p_operacao_id 
      AND data_referencia = p_data
      AND status = 'Aprovado';

    -- 3.4 Upsert na tabela de resumo (Comum)
    INSERT INTO public.faturamento_resumo_diario (
        operacao_id, data_referencia,
        total_receita_original, total_despesa_original, total_avulso_original, total_mensalista_original, resultado_liquido_original,
        ajuste_receita_total, ajuste_despesa_total, ajuste_avulso_total, ajuste_mensalista_total, ajuste_liquido_total,
        total_receita_ajustada, total_despesa_ajustada, total_avulso_ajustado, total_mensalista_ajustado, resultado_liquido_ajustado,
        quantidade_movimentos, ticket_medio,
        resumo_por_tipo_json, resumo_por_forma_pagamento_json,
        ultima_importacao_em, atualizado_em
    ) VALUES (
        p_operacao_id, p_data,
        COALESCE(v_orig_receita, 0), COALESCE(v_orig_despesa, 0), COALESCE(v_orig_avulso, 0), COALESCE(v_orig_mensalista, 0), 
        (COALESCE(v_orig_receita, 0) + COALESCE(v_orig_avulso, 0) + COALESCE(v_orig_mensalista, 0) - COALESCE(v_orig_despesa, 0)),
        
        COALESCE(v_ajuste_receita, 0), COALESCE(v_ajuste_despesa, 0), COALESCE(v_ajuste_avulso, 0), COALESCE(v_ajuste_mensalista, 0),
        (COALESCE(v_ajuste_receita, 0) + COALESCE(v_ajuste_avulso, 0) + COALESCE(v_ajuste_mensalista, 0) - COALESCE(v_ajuste_despesa, 0)),
        
        (COALESCE(v_orig_receita, 0) + COALESCE(v_ajuste_receita, 0)), 
        (COALESCE(v_orig_despesa, 0) + COALESCE(v_ajuste_despesa, 0)),
        (COALESCE(v_orig_avulso, 0) + COALESCE(v_ajuste_avulso, 0)),
        (COALESCE(v_orig_mensalista, 0) + COALESCE(v_ajuste_mensalista, 0)),
        
        ((COALESCE(v_orig_receita, 0) + COALESCE(v_ajuste_receita, 0)) + 
         (COALESCE(v_orig_avulso, 0) + COALESCE(v_ajuste_avulso, 0)) + 
         (COALESCE(v_orig_mensalista, 0) + COALESCE(v_ajuste_mensalista, 0)) - 
         (COALESCE(v_orig_despesa, 0) + COALESCE(v_ajuste_despesa, 0))),
         
        COALESCE(v_orig_count, 0),
        CASE WHEN COALESCE(v_orig_count, 0) > 0 THEN v_orig_receita / v_orig_count ELSE 0 END,
        COALESCE(v_json_tipo, '{}'), COALESCE(v_json_forma, '{}'),
        v_last_import, NOW()
    )
    ON CONFLICT (operacao_id, data_referencia) DO UPDATE SET
        total_receita_original = EXCLUDED.total_receita_original,
        total_despesa_original = EXCLUDED.total_despesa_original,
        total_avulso_original = EXCLUDED.total_avulso_original,
        total_mensalista_original = EXCLUDED.total_mensalista_original,
        resultado_liquido_original = EXCLUDED.resultado_liquido_original,
        ajuste_receita_total = EXCLUDED.ajuste_receita_total,
        ajuste_despesa_total = EXCLUDED.ajuste_despesa_total,
        ajuste_avulso_total = EXCLUDED.ajuste_avulso_total,
        ajuste_mensalista_total = EXCLUDED.ajuste_mensalista_total,
        ajuste_liquido_total = EXCLUDED.ajuste_liquido_total,
        total_receita_ajustada = EXCLUDED.total_receita_ajustada,
        total_despesa_ajustada = EXCLUDED.total_despesa_ajustada,
        total_avulso_ajustado = EXCLUDED.total_avulso_ajustado,
        total_mensalista_ajustado = EXCLUDED.total_mensalista_ajustado,
        resultado_liquido_ajustado = EXCLUDED.resultado_liquido_ajustado,
        quantidade_movimentos = EXCLUDED.quantidade_movimentos,
        ticket_medio = EXCLUDED.ticket_medio,
        resumo_por_tipo_json = EXCLUDED.resumo_por_tipo_json,
        resumo_por_forma_pagamento_json = EXCLUDED.resumo_por_forma_pagamento_json,
        ultima_importacao_em = EXCLUDED.ultima_importacao_em,
        atualizado_em = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger para sincronizar o resumo oficial quando um resumo personal é importado
CREATE OR REPLACE FUNCTION trg_sync_resumo_personal()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.reprocessar_faturamento_dia(NEW.operacao_id, NEW.data_referencia);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_after_resumo_importado_sync ON public.faturamento_resumo_importado;
CREATE TRIGGER trg_after_resumo_importado_sync
AFTER INSERT OR UPDATE ON public.faturamento_resumo_importado
FOR EACH ROW EXECUTE FUNCTION trg_sync_resumo_personal();
