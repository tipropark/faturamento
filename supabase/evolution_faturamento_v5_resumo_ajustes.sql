-- ============================================================
-- LEVE ERP — EVOLUÇÃO FATURAMENTO v5 (Resumo e Ajustes)
-- ============================================================

-- 1. TABELA DE AJUSTES FINANCEIROS
-- Registro de correções manuais com rastreabilidade
CREATE TABLE IF NOT EXISTS public.faturamento_ajustes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operacao_id UUID NOT NULL REFERENCES public.operacoes(id) ON DELETE CASCADE,
    data_referencia DATE NOT NULL,
    
    tipo_ajuste VARCHAR(20) NOT NULL CHECK (tipo_ajuste IN ('Receita', 'Despesa', 'Avulso', 'Mensalista')),
    categoria_ajuste VARCHAR(100), -- Ex: Perda de ticket, Erro de lançamento, Isenção diretoria
    forma_pagamento VARCHAR(50),
    
    valor NUMERIC(10,2) NOT NULL DEFAULT 0,
    sinal INTEGER NOT NULL DEFAULT 1 CHECK (sinal IN (1, -1)), -- 1 soma, -1 subtrai
    
    motivo TEXT NOT NULL,
    observacao TEXT,
    
    status VARCHAR(20) DEFAULT 'Aprovado' CHECK (status IN ('Pendente', 'Aprovado', 'Cancelado')),
    
    criado_por UUID, -- Referência dinâmica abaixo
    aprovado_por UUID, -- Referência dinâmica abaixo
    
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forçar atualização do check constraint caso a tabela já exista
ALTER TABLE public.faturamento_ajustes DROP CONSTRAINT IF EXISTS faturamento_ajustes_tipo_ajuste_check;
ALTER TABLE public.faturamento_ajustes ADD CONSTRAINT faturamento_ajustes_tipo_ajuste_check 
    CHECK (tipo_ajuste IN ('Receita', 'Despesa', 'Avulso', 'Mensalista'));

-- Forçar correção das FKs caso a tabela já exista com referências ao schema auth
DO $$ 
BEGIN
    -- Corrigir criado_por
    ALTER TABLE public.faturamento_ajustes DROP CONSTRAINT IF EXISTS faturamento_ajustes_criado_por_fkey;
    ALTER TABLE public.faturamento_ajustes ADD CONSTRAINT faturamento_ajustes_criado_por_fkey 
        FOREIGN KEY (criado_por) REFERENCES public.usuarios(id);
    
    -- Corrigir aprovado_por
    ALTER TABLE public.faturamento_ajustes DROP CONSTRAINT IF EXISTS faturamento_ajustes_aprovado_por_fkey;
    ALTER TABLE public.faturamento_ajustes ADD CONSTRAINT faturamento_ajustes_aprovado_por_fkey 
        FOREIGN KEY (aprovado_por) REFERENCES public.usuarios(id);
EXCEPTION WHEN OTHERS THEN 
    -- Se der erro (ex: coluna já existe ou falta permissão), ignorar e seguir
    NULL;
END $$;

-- 2. TABELA DE RESUMO DIÁRIO (BASE OFICIAL DE DASHBOARDS)
CREATE TABLE IF NOT EXISTS public.faturamento_resumo_diario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operacao_id UUID NOT NULL REFERENCES public.operacoes(id) ON DELETE CASCADE,
    data_referencia DATE NOT NULL,
    
    -- VALORES ORIGINAIS (CONSOLIDAÇÃO PURA DOS MOVIMENTOS)
    total_receita_original NUMERIC(10,2) DEFAULT 0,
    total_despesa_original NUMERIC(10,2) DEFAULT 0,
    total_avulso_original NUMERIC(10,2) DEFAULT 0,
    total_mensalista_original NUMERIC(10,2) DEFAULT 0,
    resultado_liquido_original NUMERIC(10,2) DEFAULT 0,
    
    -- AJUSTES CONSOLIDADOS
    ajuste_receita_total NUMERIC(10,2) DEFAULT 0,
    ajuste_despesa_total NUMERIC(10,2) DEFAULT 0,
    ajuste_avulso_total NUMERIC(10,2) DEFAULT 0,
    ajuste_mensalista_total NUMERIC(10,2) DEFAULT 0,
    ajuste_liquido_total NUMERIC(10,2) DEFAULT 0,
    
    -- VALORES FINAIS (AJUSTADOS - O QUE O SISTEMA EXIBE)
    total_receita_ajustada NUMERIC(10,2) DEFAULT 0,
    total_despesa_ajustada NUMERIC(10,2) DEFAULT 0,
    total_avulso_ajustado NUMERIC(10,2) DEFAULT 0,
    total_mensalista_ajustado NUMERIC(10,2) DEFAULT 0,
    resultado_liquido_ajustado NUMERIC(10,2) DEFAULT 0,
    
    -- MÉTRICAS
    quantidade_movimentos INTEGER DEFAULT 0,
    ticket_medio NUMERIC(10,2) DEFAULT 0,
    
    -- RESUMOS EM JSON (PARCO-STYLE COMPATIBILITY)
    resumo_por_tipo_json JSONB DEFAULT '{}',
    resumo_por_forma_pagamento_json JSONB DEFAULT '{}',
    
    -- CONTROLE
    ultima_importacao_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(operacao_id, data_referencia)
);

-- Garantir colunas novas caso a tabela exista
DO $$ 
BEGIN
    ALTER TABLE public.faturamento_resumo_diario ADD COLUMN IF NOT EXISTS total_mensalista_original NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE public.faturamento_resumo_diario ADD COLUMN IF NOT EXISTS ajuste_mensalista_total NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE public.faturamento_resumo_diario ADD COLUMN IF NOT EXISTS total_mensalista_ajustado NUMERIC(10,2) DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_faturamento_resumo_lookup ON faturamento_resumo_diario (operacao_id, data_referencia);

-- 3. FUNÇÃO DE REPROCESSAMENTO DIÁRIO
-- Esta função unifica os movimentos brutos e os ajustes em um resumo único.
CREATE OR REPLACE FUNCTION public.reprocessar_faturamento_dia(p_operacao_id UUID, p_data DATE)
RETURNS VOID AS $$
DECLARE
    v_orig_receita NUMERIC(10,2) := 0;
    v_orig_despesa NUMERIC(10,2) := 0;
    v_orig_avulso NUMERIC(10,2) := 0;
    v_orig_mensalista NUMERIC(10,2) := 0;
    v_orig_count INTEGER := 0;
    
    v_ajuste_receita NUMERIC(10,2) := 0;
    v_ajuste_despesa NUMERIC(10,2) := 0;
    v_ajuste_avulso NUMERIC(10,2) := 0;
    v_ajuste_mensalista NUMERIC(10,2) := 0;
    
    v_json_tipo JSONB;
    v_json_forma JSONB;
    v_last_import TIMESTAMPTZ;
BEGIN
    -- 3.1 Capturar totais originais dos movimentos
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

    -- Se não houver tipos específicos, tratar tudo não-despesa/não-avulso/não-mensalista como receita genérica para compatibilidade
    IF v_orig_receita IS NULL AND v_orig_despesa IS NOT NULL THEN
       SELECT SUM(CASE WHEN tipo_movimento NOT IN ('Despesa', 'Avulso', 'Mensalista') THEN valor ELSE 0 END) 
       INTO v_orig_receita 
       FROM public.faturamento_movimentos 
       WHERE operacao_id = p_operacao_id AND (data_saida::DATE = p_data OR (data_saida IS NULL AND criado_em::DATE = p_data));
    END IF;

    -- 3.2 Capturar totais de ajustes aprovados
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

    -- 3.3 Construir agregados JSON
    SELECT jsonb_object_agg(tipo_movimento, json_build_object('total', total, 'count', qtde)) INTO v_json_tipo
    FROM (
        SELECT tipo_movimento, SUM(valor) as total, COUNT(*) as qtde
        FROM public.faturamento_movimentos 
        WHERE operacao_id = p_operacao_id 
          AND (data_saida::DATE = p_data OR (data_saida IS NULL AND criado_em::DATE = p_data))
        GROUP BY tipo_movimento
    ) t;

    SELECT jsonb_object_agg(forma_pagamento, json_build_object('total', total, 'count', qtde)) INTO v_json_forma
    FROM (
        SELECT COALESCE(forma_pagamento, 'OUTROS') as forma_pagamento, SUM(valor) as total, COUNT(*) as qtde
        FROM public.faturamento_movimentos 
        WHERE operacao_id = p_operacao_id 
          AND (data_saida::DATE = p_data OR (data_saida IS NULL AND criado_em::DATE = p_data))
        GROUP BY forma_pagamento
    ) f;

    -- 3.4 Upsert na tabela de resumo
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

-- 4. TRIGGERS DE AUTOMAÇÃO (OTIMIZADOS PARA CARGA EM MASSA)

-- 4.1 Trigger para movimentos (Processamento em Lote)
-- Alterado para STATEMENT LEVEL para evitar timeout em importações grandes (ex: 6000 registros)
CREATE OR REPLACE FUNCTION trg_sync_resumo_movimentos_statement()
RETURNS TRIGGER AS $$
BEGIN
    -- Identifica todos os dias/operações afetados no lote e processa cada par uma única vez
    PERFORM public.reprocessar_faturamento_dia(t.operacao_id, t.data_ref)
    FROM (
        SELECT DISTINCT 
            operacao_id, 
            COALESCE(data_saida::DATE, criado_em::DATE) as data_ref
        FROM inserted_rows 
    ) t;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Removemos o trigger antigo de linha para evitar redundância e lentidão
DROP TRIGGER IF EXISTS trg_after_movimento_sync ON public.faturamento_movimentos;

-- Criamos o trigger de instrução (mais performático para o Agente)
DROP TRIGGER IF EXISTS trg_after_movimento_sync_stmt ON public.faturamento_movimentos;
CREATE TRIGGER trg_after_movimento_sync_stmt
AFTER INSERT ON public.faturamento_movimentos
REFERENCING NEW TABLE AS inserted_rows
FOR EACH STATEMENT
EXECUTE FUNCTION trg_sync_resumo_movimentos_statement();

-- Para Updates (correções pontuais), mantemos o de linha por ser mais simples e raro ocorrer em lote massivo
CREATE OR REPLACE FUNCTION trg_sync_resumo_movimentos_row()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.reprocessar_faturamento_dia(NEW.operacao_id, COALESCE(NEW.data_saida::DATE, NEW.criado_em::DATE));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_after_movimento_update ON public.faturamento_movimentos;
CREATE TRIGGER trg_after_movimento_update
AFTER UPDATE ON public.faturamento_movimentos
FOR EACH ROW 
WHEN (OLD.valor IS DISTINCT FROM NEW.valor OR OLD.tipo_movimento IS DISTINCT FROM NEW.tipo_movimento)
EXECUTE FUNCTION trg_sync_resumo_movimentos_row();

-- 4.2 Trigger para novos ajustes
CREATE OR REPLACE FUNCTION trg_sync_resumo_ajustes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM public.reprocessar_faturamento_dia(OLD.operacao_id, OLD.data_referencia);
        RETURN OLD;
    ELSE
        PERFORM public.reprocessar_faturamento_dia(NEW.operacao_id, NEW.data_referencia);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_after_ajuste_sync ON public.faturamento_ajustes;
CREATE TRIGGER trg_after_ajuste_sync
AFTER INSERT OR UPDATE OR DELETE ON public.faturamento_ajustes
FOR EACH ROW EXECUTE FUNCTION trg_sync_resumo_ajustes();

-- 5. POLÍTICA DE RETENÇÃO (Buffer de 7 dias)
-- Função para ser chamada via Cron ou Agendador
CREATE OR REPLACE FUNCTION public.purgar_faturamento_antigo()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    -- Só deletamos se o resumo do dia já existir e estar atualizado
    DELETE FROM public.faturamento_movimentos
    WHERE criado_em < NOW() - INTERVAL '8 days'
      AND EXISTS (
        SELECT 1 FROM faturamento_resumo_diario fr 
        WHERE fr.operacao_id = faturamento_movimentos.operacao_id 
          AND fr.data_referencia = COALESCE(faturamento_movimentos.data_saida::DATE, faturamento_movimentos.criado_em::DATE)
      );
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CARGA INICIAL (Migration de dados existentes)
-- Converte todo o faturamento_movimentos atual em resumos
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT DISTINCT operacao_id, COALESCE(data_saida::DATE, criado_em::DATE) as data_ref
        FROM faturamento_movimentos
    LOOP
        PERFORM public.reprocessar_faturamento_dia(rec.operacao_id, rec.data_ref);
    END LOOP;
END $$;

-- 7. AUDITORIA
DO $$ 
BEGIN
    CALL sp_ativar_auditoria_tabela('faturamento_ajustes');
    CALL sp_ativar_auditoria_tabela('faturamento_resumo_diario');
END $$;
