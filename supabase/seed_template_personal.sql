-- ============================================================
-- LEVE ERP — Inserção do Template Personal
-- ============================================================

INSERT INTO public.faturamento_query_templates (
    nome, 
    sistema, 
    sql_template, 
    mapping_saida, 
    exemplo_parametros, 
    ativo
) VALUES (
    'Personal Padrão (Firebird)',
    'PERSONAL',
    'SELECT
        CAST(m.CODENTRA AS VARCHAR(100)) AS "ticket_label",
        CAST(m.DT_ENTRA || '' '' || m.HR_ENTRA AS TIMESTAMP) AS "data_entrada",
        CAST(m.DT_SAIDA || '' '' || m.HR_SAIDA AS TIMESTAMP) AS "data_saida",
        m.VALOR_BAI AS "valor",
        CASE
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = ''1'' THEN ''DINHEIRO''
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = ''2'' THEN ''PIX''
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) = ''4'' THEN ''CONVENIO''
            WHEN TRIM(CAST(m.COBRANCA AS VARCHAR(10))) IN (''5'', ''P1'') THEN
                CASE
                    WHEN TRIM(COALESCE(CAST(m.DESCCARTAO AS VARCHAR(30)), '''')) <> '''' THEN
                        ''CARTAO - '' || TRIM(CAST(m.DESCCARTAO AS VARCHAR(30)))
                    ELSE ''CARTAO''
                END
            ELSE ''OUTROS''
        END AS "forma_pagamento",
        ''Avulso'' AS "tipo_movimento",
        NULL AS "descricao"
    FROM MOVIMENTACAO m
    WHERE m.DT_SAIDA >= ''{data_inicio}'' AND m.DT_SAIDA <= ''{data_fim}''
      AND m.DT_SAIDA IS NOT NULL
      AND m.HR_SAIDA IS NOT NULL
    ORDER BY 3',
    '{
        "ticket_label": "ticket_label",
        "data_entrada": "data_entrada",
        "data_saida": "data_saida",
        "valor": "valor",
        "forma_pagamento": "forma_pagamento",
        "tipo_movimento": "tipo_movimento",
        "descricao": "descricao"
    }'::jsonb,
    '{
        "data_inicio": "2024-03-01",
        "data_fim": "2024-03-31"
    }'::jsonb,
    true
) ON CONFLICT (nome) DO UPDATE SET 
    sql_template = EXCLUDED.sql_template,
    mapping_saida = EXCLUDED.mapping_saida,
    exemplo_parametros = EXCLUDED.exemplo_parametros;
