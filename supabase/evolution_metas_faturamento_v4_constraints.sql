-- LEVE ERP — Reforço de Integridade: Metas de Faturamento
-- Garante que não existam metas duplicadas para a mesma operação no mesmo período.

-- 1. LIMPEZA DE DUPLICIDADES (se existirem)
-- Mantém apenas a meta mais recente criada para cada par (período, operação)
DELETE FROM public.metas_faturamento
WHERE id NOT IN (
    SELECT id
    FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY COALESCE(operacao_id, '00000000-0000-0000-0000-000000000000'::uuid), ano, mes ORDER BY criado_em DESC) as rn
        FROM public.metas_faturamento
    ) t
    WHERE rn = 1
);

-- 2. GARANTIA DA CONSTRAINT UNIQUE
-- Primeiro removemos qualquer versão antiga para evitar conflitos de nome
ALTER TABLE public.metas_faturamento DROP CONSTRAINT IF EXISTS unq_meta_operacao_periodo;

-- Adiciona a constraint UNIQUE (considerando que null em operacao_id é a meta global)
-- Em PG, UNIQUE permite múltiplos NULLs por padrão, então criamos um índice único condicional
-- para garantir apenas UMA meta Global por período.
CREATE UNIQUE INDEX IF NOT EXISTS unq_meta_global_periodo 
ON public.metas_faturamento (ano, mes) 
WHERE operacao_id IS NULL;

-- Adiciona a constraint para operações específicas
ALTER TABLE public.metas_faturamento 
ADD CONSTRAINT unq_meta_operacao_periodo UNIQUE (operacao_id, ano, mes);

NOTIFY pgrst, 'reload schema';
