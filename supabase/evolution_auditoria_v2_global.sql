-- ============================================================
-- LEVE ERP — Evolução: Auditoria Global e Automática (v2)
-- ============================================================

-- 1. Função Genérica de Auditoria para Triggers
CREATE OR REPLACE FUNCTION fn_auditoria_global_automatica()
RETURNS TRIGGER AS $$
DECLARE
    v_usuario_id UUID;
    v_dados_anteriores JSONB := NULL;
    v_dados_novos JSONB := NULL;
    v_acao VARCHAR(50);
    v_entidade VARCHAR(100);
    v_modulo VARCHAR(100);
    v_descricao TEXT;
    v_registro_id VARCHAR(100);
BEGIN
    -- Obter ID do usuário do contexto do Supabase ou da sessão personalizada
    -- Nota: 'audit.current_user_id' pode ser configurado no app via SQL antes do comando
    v_usuario_id := COALESCE(
        current_setting('audit.current_user_id', true)::UUID,
        auth.uid()
    );

    v_entidade := TG_TABLE_NAME;
    v_registro_id := CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT 
        ELSE NEW.id::TEXT 
    END;

    -- Mapeamento de Módulo Baseado na Tabela
    v_modulo := CASE
        WHEN v_entidade LIKE 'sinistros%' THEN 'sinistros'
        WHEN v_entidade LIKE 'tarifarios%' THEN 'tarifarios'
        WHEN v_entidade LIKE 'operacoes%' THEN 'operacoes'
        WHEN v_entidade LIKE 'perfis%' OR v_entidade = 'perfis_permissoes' THEN 'permissoes'
        WHEN v_entidade = 'configuracoes_sistema' THEN 'configuracoes'
        WHEN v_entidade = 'usuarios' THEN 'usuarios'
        ELSE 'sistema'
    END;

    IF (TG_OP = 'INSERT') THEN
        v_acao := 'create';
        v_dados_novos := to_jsonb(NEW);
        v_descricao := 'Criação de novo registro em ' || v_entidade;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_acao := 'update';
        v_dados_anteriores := to_jsonb(OLD);
        v_dados_novos := to_jsonb(NEW);
        v_descricao := 'Atualização de registro em ' || v_entidade;
    ELSIF (TG_OP = 'DELETE') THEN
        v_acao := 'delete';
        v_dados_anteriores := to_jsonb(OLD);
        v_descricao := 'Exclusão de registro em ' || v_entidade;
    END IF;

    -- Registrar na tabela de auditoria se houver mudança relevante
    -- (Opcional: evitar logs se dados forem idênticos no Update)
    IF (TG_OP != 'UPDATE' OR v_dados_anteriores != v_dados_novos) THEN
        INSERT INTO auditoria_administrativa (
            usuario_id, 
            modulo, 
            acao, 
            descricao, 
            entidade_afetada, 
            registro_id, 
            dados_anteriores, 
            dados_novos,
            origem,
            status,
            criticidade,
            criado_em
        ) VALUES (
            v_usuario_id,
            v_modulo,
            v_acao || '_' || v_entidade,
            v_descricao,
            v_entidade,
            v_registro_id,
            v_dados_anteriores,
            v_dados_novos,
            'sistema',
            'sucesso',
            CASE WHEN TG_OP = 'DELETE' THEN 'alta'::criticidade_log ELSE 'media'::criticidade_log END,
            NOW()
        );
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper para Aplicar Auditoria em Massa
-- Esta procedure facilita ativar a auditoria em qualquer tabela nova no futuro.
CREATE OR REPLACE PROCEDURE sp_ativar_auditoria_tabela(p_tabela_nome TEXT)
AS $$
BEGIN
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON %I', p_tabela_nome, p_tabela_nome);
    EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION fn_auditoria_global_automatica()', p_tabela_nome, p_tabela_nome);
END;
$$ LANGUAGE plpgsql;

-- 3. Ativar Auditoria nos Módulos Existentes
DO $$ 
BEGIN
    CALL sp_ativar_auditoria_tabela('usuarios');
    CALL sp_ativar_auditoria_tabela('configuracoes_sistema');
    CALL sp_ativar_auditoria_tabela('perfis_sistema');
    CALL sp_ativar_auditoria_tabela('perfis_permissoes');
    CALL sp_ativar_auditoria_tabela('sinistros');
    CALL sp_ativar_auditoria_tabela('anexos');
    CALL sp_ativar_auditoria_tabela('inconsistencias');
    CALL sp_ativar_auditoria_tabela('solicitacoes_tarifario');
    CALL sp_ativar_auditoria_tabela('tarifarios_anexos');
    CALL sp_ativar_auditoria_tabela('operacoes');
END $$;


-- 4. Função para Registrar Tentativas Negadas (Exemplo de Chamada via SQL)
CREATE OR REPLACE FUNCTION fn_registrar_acesso_negado(
    p_usuario_id UUID, 
    p_modulo VARCHAR, 
    p_descricao TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO auditoria_administrativa (
        usuario_id, modulo, acao, descricao, status, criticidade, origem
    ) VALUES (
        p_usuario_id, p_modulo, 'access_denied', p_descricao, 'negado', 'alta', 'sistema'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
