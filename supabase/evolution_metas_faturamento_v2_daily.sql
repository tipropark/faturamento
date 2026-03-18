-- LEVE ERP — Evolução: Metas Diárias e Acompanhamento de Ritmo
-- Versão: 2.0 | Março/2026

-- 1. NOVA TABELA: metas_faturamento_apuracoes_diarias
CREATE TABLE IF NOT EXISTS public.metas_faturamento_apuracoes_diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meta_id UUID NOT NULL REFERENCES public.metas_faturamento(id) ON DELETE CASCADE,
    operacao_id UUID NULL REFERENCES public.operacoes(id),
    data_referencia DATE NOT NULL,
    valor_realizado_dia NUMERIC(14,2) NOT NULL DEFAULT 0,
    valor_acumulado_mes NUMERIC(14,2) NOT NULL DEFAULT 0,
    valor_meta_mensal NUMERIC(14,2) NOT NULL,
    valor_meta_parcial_esperada NUMERIC(14,2) NULL,
    desvio_dia NUMERIC(14,2) NULL,
    desvio_acumulado NUMERIC(14,2) NULL,
    percentual_atingimento_acumulado NUMERIC(7,2) NULL,
    status_dia VARCHAR(30) NOT NULL, 
    -- 'em_linha' | 'abaixo_do_esperado' | 'acima_do_esperado' | 'sem_dados' | 'apuracao_inconclusiva'
    confianca_apuracao VARCHAR(20) NOT NULL DEFAULT 'alta',
    ultima_sincronizacao_em TIMESTAMPTZ NULL,
    apurado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(meta_id, data_referencia)
);

CREATE INDEX IF NOT EXISTS idx_apuracoes_diarias_meta ON public.metas_faturamento_apuracoes_diarias(meta_id);
CREATE INDEX IF NOT EXISTS idx_apuracoes_diarias_operacao ON public.metas_faturamento_apuracoes_diarias(operacao_id);
CREATE INDEX IF NOT EXISTS idx_apuracoes_diarias_data ON public.metas_faturamento_apuracoes_diarias(data_referencia);

-- 2. FUNÇÃO: reprocessar_metas_diarias
-- Esta função calcula o desempenho diário de uma meta para todos os dias do mês até a data atual
CREATE OR REPLACE FUNCTION public.reprocessar_metas_diarias(p_meta_id UUID)
RETURNS VOID AS $$
DECLARE
    rec_meta RECORD;
    rec_resumo RECORD;
    v_data_inicio DATE;
    v_data_fim DATE;
    v_data_cursor DATE;
    v_dias_mes INTEGER;
    v_acumulado NUMERIC(14,2) := 0;
    v_meta_parcial NUMERIC(14,2);
    v_status VARCHAR(30);
    v_tolerancia NUMERIC := 0.05; -- 5% de tolerância para 'em_linha'
BEGIN
    -- 1. Carregar dados da meta
    SELECT * INTO rec_meta FROM public.metas_faturamento WHERE id = p_meta_id;
    IF NOT FOUND THEN RETURN; END IF;

    -- 2. Definir balizas de data
    v_data_inicio := (rec_meta.ano || '-' || rec_meta.mes || '-01')::DATE;
    v_data_fim := (v_data_inicio + interval '1 month' - interval '1 day')::DATE;
    v_dias_mes := EXTRACT(DAY FROM v_data_fim);

    -- 3. Limpar apurações antigas daquela meta
    DELETE FROM public.metas_faturamento_apuracoes_diarias WHERE meta_id = p_meta_id;

    -- 4. Loop por dia do mês
    v_data_cursor := v_data_inicio;
    WHILE v_data_cursor <= v_data_fim AND v_data_cursor <= CURRENT_DATE LOOP
        
        -- Meta parcial linear
        v_meta_parcial := (rec_meta.valor_meta / v_dias_mes) * EXTRACT(DAY FROM v_data_cursor);
        
        -- Buscar realizado do dia no faturamento consolidado
        IF rec_meta.operacao_id IS NULL THEN
            -- Meta GLOBAL: Soma todas as operações
            SELECT 
                SUM(resultado_liquido_ajustado) as liq
            INTO rec_resumo
            FROM public.faturamento_resumo_diario
            WHERE data_referencia = v_data_cursor;
        ELSE
            -- Meta por OPERACAO
            SELECT 
                resultado_liquido_ajustado as liq
            INTO rec_resumo
            FROM public.faturamento_resumo_diario
            WHERE operacao_id = rec_meta.operacao_id AND data_referencia = v_data_cursor;
        END IF;

        v_acumulado := v_acumulado + COALESCE(rec_resumo.liq, 0);

        -- Lógica de Status
        IF rec_resumo.liq IS NULL THEN
            v_status := 'sem_dados';
        ELSIF v_acumulado >= v_meta_parcial * (1 - v_tolerancia) AND v_acumulado <= v_meta_parcial * (1 + v_tolerancia) THEN
            v_status := 'em_linha';
        ELSIF v_acumulado > v_meta_parcial THEN
            v_status := 'acima_do_esperado';
        ELSE
            v_status := 'abaixo_do_esperado';
        END IF;

        -- Inserir apuração diária
        INSERT INTO public.metas_faturamento_apuracoes_diarias (
            meta_id, operacao_id, data_referencia,
            valor_realizado_dia, valor_acumulado_mes, valor_meta_mensal,
            valor_meta_parcial_esperada, desvio_dia, desvio_acumulado,
            percentual_atingimento_acumulado, status_dia
        ) VALUES (
            p_meta_id, rec_meta.operacao_id, v_data_cursor,
            COALESCE(rec_resumo.liq, 0), v_acumulado, rec_meta.valor_meta,
            v_meta_parcial, (COALESCE(rec_resumo.liq, 0) - (rec_meta.valor_meta / v_dias_mes)),
            (v_acumulado - v_meta_parcial),
            (CASE WHEN rec_meta.valor_meta > 0 THEN (v_acumulado / rec_meta.valor_meta) * 100 ELSE 0 END),
            v_status
        );

        v_data_cursor := v_data_cursor + 1;
    END LOOP;

    -- 5. Atualizar a apuração mensal consolidada baseada nos novos cálculos
    -- (Busca o último dia apurado)
    UPDATE public.metas_faturamento_apuracoes
    SET 
        valor_realizado = v_acumulado,
        desvio_valor = v_acumulado - rec_meta.valor_meta,
        percentual_atingimento = (CASE WHEN rec_meta.valor_meta > 0 THEN (v_acumulado / rec_meta.valor_meta) * 100 ELSE 0 END),
        status_apuracao = (
            CASE 
                WHEN v_acumulado >= rec_meta.valor_meta THEN 'meta_atingida'
                WHEN v_data_cursor > v_data_fim AND v_acumulado < rec_meta.valor_meta THEN 'meta_nao_atingida'
                ELSE 'meta_em_risco'
            END
        ),
        apurado_em = now()
    WHERE meta_id = p_meta_id;

END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGER: Atualizar metas quando houver novos resumos diários
CREATE OR REPLACE FUNCTION public.trg_update_meta_on_faturamento()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id UUID;
BEGIN
    -- Localiza a meta ativa para esta operação no mês/ano do resumo
    SELECT id INTO v_meta_id 
    FROM public.metas_faturamento 
    WHERE operacao_id = NEW.operacao_id 
      AND ano = EXTRACT(YEAR FROM NEW.data_referencia)
      AND mes = EXTRACT(MONTH FROM NEW.data_referencia)
      AND status = 'ativa'
    LIMIT 1;

    IF v_meta_id IS NOT NULL THEN
        PERFORM public.reprocessar_metas_diarias(v_meta_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_faturamento_update_metas ON public.faturamento_resumo_diario;
CREATE TRIGGER trg_after_faturamento_update_metas
AFTER INSERT OR UPDATE ON public.faturamento_resumo_diario
FOR EACH ROW EXECUTE FUNCTION public.trg_update_meta_on_faturamento();

-- 4. ATIVAÇÃO DA AUDITORIA
CALL sp_ativar_auditoria_tabela('metas_faturamento_apuracoes_diarias');

NOTIFY pgrst, 'reload schema';
