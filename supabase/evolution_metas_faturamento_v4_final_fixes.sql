-- LEVE ERP — Finalização Módulo Metas (v4)
-- Foco: Integridade de Dados, Bloqueio de Duplicidade e Sincronização de Faturamento Ajustado

-- 1. GARANTIR UNICIDADE DE METAS ATIVAS (Resolução de Erro de Chave Duplicada)
-- Removemos as constraints antigas que impediam criar novas metas mesmo após cancelar as anteriores
DO $$ 
BEGIN
    -- Remove constraint original rígida (que bloqueava cadastrar nova meta após cancelar)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unq_meta_operacao_periodo') THEN
        ALTER TABLE public.metas_faturamento DROP CONSTRAINT unq_meta_operacao_periodo;
    END IF;
    
    -- Remove constraint com erro de digitação da versão anterior se existir
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unq_meta_operacion_periodo_ativa') THEN
        ALTER TABLE public.metas_faturamento DROP CONSTRAINT unq_meta_operacion_periodo_ativa;
    END IF;
END $$;

-- 1.1 Limpeza de duplicatas existentes para permitir a criação do índice
DELETE FROM public.metas_faturamento
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY operacao_id, ano, mes ORDER BY criado_em DESC) as row_num
        FROM public.metas_faturamento
        WHERE status = 'ativa'
    ) t
    WHERE t.row_num > 1
);

-- Criamos índices parciais: permitem múltiplas metas no histórico, mas apenas UMA ativa por vez
CREATE UNIQUE INDEX IF NOT EXISTS unq_meta_ativa_operacao_periodo 
ON public.metas_faturamento (operacao_id, ano, mes) 
WHERE (status = 'ativa' AND operacao_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS unq_meta_ativa_global_periodo 
ON public.metas_faturamento (ano, mes) 
WHERE (status = 'ativa' AND tipo_meta = 'global');

-- 2. GARANTIR UNICIDADE NA APURAÇÃO CONSOLIDADA (Para UPSERT)
DELETE FROM public.metas_faturamento_apuracoes
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY meta_id ORDER BY apurado_em DESC) as row_num
        FROM public.metas_faturamento_apuracoes
    ) t
    WHERE t.row_num > 1
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unq_apuracao_meta_id') THEN
        ALTER TABLE public.metas_faturamento_apuracoes ADD CONSTRAINT unq_apuracao_meta_id UNIQUE (meta_id);
    END IF;
END $$;

-- 3. AJUSTES ESTRUTURAIS NAS TABELAS
ALTER TABLE public.metas_faturamento 
ADD COLUMN IF NOT EXISTS meta_diaria_padrao NUMERIC(14,2) NULL,
ADD COLUMN IF NOT EXISTS considera_dias_semana BOOLEAN DEFAULT TRUE;

ALTER TABLE public.metas_faturamento_apuracoes_diarias
ADD COLUMN IF NOT EXISTS meta_planejada NUMERIC(14,2) NULL,
ADD COLUMN IF NOT EXISTS meta_ajustada_manual NUMERIC(14,2) NULL,
ADD COLUMN IF NOT EXISTS observacao TEXT NULL,
ADD COLUMN IF NOT EXISTS fechamento_confirmado_em TIMESTAMPTZ NULL;

ALTER TABLE public.metas_faturamento_apuracoes
ADD COLUMN IF NOT EXISTS valor_meta_parcial_esperada NUMERIC(14,2) DEFAULT 0;

-- 4. ATUALIZAÇÃO DA FUNÇÃO DE REPROCESSAMENTO (Lógica de Billing Ajustado)
CREATE OR REPLACE FUNCTION public.reprocessar_metas_diarias(p_meta_id UUID)
RETURNS VOID AS $$
DECLARE
    rec_meta RECORD;
    v_realizado_dia NUMERIC(14,2);
    v_data_inicio DATE;
    v_data_fim DATE;
    v_data_cursor DATE;
    v_dias_mes INTEGER;
    v_dias_passados INTEGER := 0;
    v_acumulado NUMERIC(14,2) := 0;
    v_meta_parcial_esperada NUMERIC(14,2) := 0;
    v_meta_diaria_calculada NUMERIC(14,2);
    v_status_dia VARCHAR(30);
    v_status_mensal VARCHAR(30);
    v_projecao NUMERIC(14,2) := 0;
    v_tolerancia NUMERIC := 0.05; 
BEGIN
    -- 1. Carregar dados da meta
    SELECT * INTO rec_meta FROM public.metas_faturamento WHERE id = p_meta_id;
    IF NOT FOUND THEN RETURN; END IF;

    -- 2. Definir balizas de data
    v_data_inicio := (rec_meta.ano || '-' || rec_meta.mes || '-01')::DATE;
    v_data_fim := (v_data_inicio + interval '1 month' - interval '1 day')::DATE;
    v_dias_mes := EXTRACT(DAY FROM v_data_fim);
    v_meta_diaria_calculada := rec_meta.valor_meta / v_dias_mes;

    -- 3. Limpar apurações antigas (não confirmadas)
    DELETE FROM public.metas_faturamento_apuracoes_diarias 
    WHERE meta_id = p_meta_id AND fechamento_confirmado_em IS NULL;

    -- 4. Loop Consolidador (Fonte: Faturamento Resumo Ajustado)
    v_data_cursor := v_data_inicio;
    WHILE v_data_cursor <= v_data_fim AND v_data_cursor <= CURRENT_DATE LOOP
        
        v_dias_passados := v_dias_passados + 1;
        v_meta_parcial_esperada := v_meta_diaria_calculada * v_dias_passados;
        
        -- Soma apenas componentes de RECEITA (Faturamento Bruto Ajustado)
        IF rec_meta.operacao_id IS NULL THEN
            SELECT SUM(COALESCE(total_receita_ajustada, 0) + COALESCE(total_avulso_ajustado, 0) + COALESCE(total_mensalista_ajustado, 0))
            INTO v_realizado_dia FROM public.faturamento_resumo_diario WHERE data_referencia = v_data_cursor;
        ELSE
            SELECT (COALESCE(total_receita_ajustada, 0) + COALESCE(total_avulso_ajustado, 0) + COALESCE(total_mensalista_ajustado, 0))
            INTO v_realizado_dia FROM public.faturamento_resumo_diario WHERE operacao_id = rec_meta.operacao_id AND data_referencia = v_data_cursor;
        END IF;

        v_realizado_dia := COALESCE(v_realizado_dia, 0);
        v_acumulado := v_acumulado + v_realizado_dia;

        -- Status por dia
        IF v_realizado_dia = 0 THEN v_status_dia := 'sem_dados';
        ELSIF v_realizado_dia >= v_meta_diaria_calculada * (1 + v_tolerancia) THEN v_status_dia := 'acima_da_meta';
        ELSIF v_realizado_dia >= v_meta_diaria_calculada * (1 - v_tolerancia) THEN v_status_dia := 'dentro_da_meta';
        ELSE v_status_dia := 'abaixo_da_meta'; END IF;

        INSERT INTO public.metas_faturamento_apuracoes_diarias (
            meta_id, operacao_id, data_referencia,
            valor_realizado_dia, valor_acumulado_mes, valor_meta_mensal,
            valor_meta_parcial_esperada, meta_planejada, desvio_dia, desvio_acumulado,
            percentual_atingimento_acumulado, status_dia
        ) VALUES (
            p_meta_id, rec_meta.operacao_id, v_data_cursor,
            v_realizado_dia, v_acumulado, rec_meta.valor_meta,
            v_meta_parcial_esperada, v_meta_diaria_calculada,
            (v_realizado_dia - v_meta_diaria_calculada),
            (v_acumulado - v_meta_parcial_esperada),
            (CASE WHEN rec_meta.valor_meta > 0 THEN (v_acumulado / rec_meta.valor_meta) * 100 ELSE 0 END),
            v_status_dia
        ) ON CONFLICT (meta_id, data_referencia) DO UPDATE SET
            valor_realizado_dia = EXCLUDED.valor_realizado_dia,
            valor_acumulado_mes = EXCLUDED.valor_acumulado_mes,
            valor_meta_parcial_esperada = EXCLUDED.valor_meta_parcial_esperada,
            desvio_dia = EXCLUDED.desvio_dia,
            desvio_acumulado = EXCLUDED.desvio_acumulado,
            percentual_atingimento_acumulado = EXCLUDED.percentual_atingimento_acumulado,
            status_dia = EXCLUDED.status_dia,
            apurado_em = now();

        v_data_cursor := v_data_cursor + 1;
    END LOOP;

    -- 5. Projeção e Status Mensal
    IF v_dias_passados > 0 THEN v_projecao := (v_acumulado / v_dias_passados) * v_dias_mes; END IF;

    IF v_acumulado >= v_meta_parcial_esperada THEN v_status_mensal := 'no_ritmo';
    ELSIF v_acumulado >= v_meta_parcial_esperada * 0.90 THEN v_status_mensal := 'levemente_atrasada';
    ELSIF v_acumulado >= v_meta_parcial_esperada * 0.75 THEN v_status_mensal := 'em_recuperacao';
    ELSE v_status_mensal := 'critica'; END IF;

    -- 6. Sincronização Final (UPSERT Consolidado)
    INSERT INTO public.metas_faturamento_apuracoes (
        meta_id, operacao_id, ano, mes, valor_meta,
        valor_realizado, valor_projetado, valor_meta_parcial_esperada,
        desvio_valor, percentual_atingimento, status_apuracao, apurado_em
    ) VALUES (
        p_meta_id, rec_meta.operacao_id, rec_meta.ano, rec_meta.mes, rec_meta.valor_meta,
        v_acumulado, v_projecao, v_meta_parcial_esperada,
        (v_acumulado - v_meta_parcial_esperada),
        (CASE WHEN rec_meta.valor_meta > 0 THEN (v_acumulado / rec_meta.valor_meta) * 100 ELSE 0 END),
        v_status_mensal, now()
    ) ON CONFLICT (meta_id) DO UPDATE SET
        valor_realizado = EXCLUDED.valor_realizado,
        valor_projetado = EXCLUDED.valor_projetado,
        valor_meta_parcial_esperada = EXCLUDED.valor_meta_parcial_esperada,
        desvio_valor = EXCLUDED.desvio_valor,
        percentual_atingimento = EXCLUDED.percentual_atingimento,
        status_apuracao = EXCLUDED.status_apuracao,
        apurado_em = now();
END;
$$ LANGUAGE plpgsql;

-- 7. REFORÇAR SINCRONIZAÇÃO EM MASSA
DO $$
DECLARE v_m RECORD;
BEGIN
    FOR v_m IN SELECT id FROM public.metas_faturamento WHERE status = 'ativa' LOOP
        PERFORM public.reprocessar_metas_diarias(v_m.id);
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
