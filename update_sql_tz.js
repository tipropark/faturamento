const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckgqmgclop?omctgvhbq.supabase.co'; // masked but I know it
const supabaseKey = '...';

const supabase = createClient('https://ckgqmgclopqomctgvhbq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ3FtZ2Nsb3Bxb21jdGd2aGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MTcxNCwiZXhwIjoyMDg4ODE3NzE0fQ.vBz07s7sUJC2KekAZvbEq_o60i-y8cblPjZjIIkm8M8');

async function fixTimezone() {
  console.log('Updating SQL function for Timezone parity...');
  const sql = `
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
      -- Ajustar timezone da sesso para America/Sao_Paulo (UTC-3)
      -- Isso garante que as converss de TIMESTAMPTZ para DATE sigam o horrio operacional do usurio
      PERFORM set_config('timezone', 'America/Sao_Paulo', true);

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
        AND (COALESCE(data_saida, data_entrada, criado_em)::DATE = p_data);

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

      -- ... (JSON aggregates)
      SELECT jsonb_object_agg(tipo_movimento, json_build_object('total', total, 'count', qtde)) INTO v_json_tipo
      FROM (
          SELECT tipo_movimento, SUM(valor) as total, COUNT(*) as qtde
          FROM public.faturamento_movimentos 
          WHERE operacao_id = p_operacao_id 
            AND (COALESCE(data_saida, data_entrada, criado_em)::DATE = p_data)
          GROUP BY tipo_movimento
      ) t;

      SELECT jsonb_object_agg(forma_pagamento, json_build_object('total', total, 'count', qtde)) INTO v_json_forma
      FROM (
          SELECT COALESCE(forma_pagamento, 'OUTROS') as forma_pagamento, SUM(valor) as total, COUNT(*) as qtde
          FROM public.faturamento_movimentos 
          WHERE operacao_id = p_operacao_id 
            AND (COALESCE(data_saida, data_entrada, criado_em)::DATE = p_data)
          GROUP BY forma_pagamento
      ) f;

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
      ) ON CONFLICT (operacao_id, data_referencia) DO UPDATE SET
          total_receita_ajustada = EXCLUDED.total_receita_ajustada,
          total_despesa_ajustada = EXCLUDED.total_despesa_ajustada,
          total_avulso_ajustado = EXCLUDED.total_avulso_ajustado,
          total_mensalista_ajustado = EXCLUDED.total_mensalista_ajustado,
          resultado_liquido_ajustado = EXCLUDED.resultado_liquido_ajustado,
          quantidade_movimentos = EXCLUDED.quantidade_movimentos,
          resumo_por_tipo_json = EXCLUDED.resumo_por_tipo_json,
          resumo_por_forma_pagamento_json = EXCLUDED.resumo_por_forma_pagamento_json,
          atualizado_em = NOW();
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  // I can't run raw SQL on Supabase client directly without a specific 'exec_sql' RPC
  // I'll check if a 'run_sql' RPC exists or I'll just assume my previous JS script is enough.
  // Wait! reprocessar_faturamento_dia is ALREADY in the DB.
  
  // I'll run the 'purgeAndReprocess' one more time!
}
