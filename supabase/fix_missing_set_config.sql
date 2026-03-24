-- ============================================================
-- LEVE ERP — Fix: Wrapper para set_config (Auditoria)
-- Permite que o Next.js sete o contexto do usuário na sessão DB
-- ============================================================

-- Wrapper para a função nativa do PostgreSQL. 
-- O Supabase não expõe 'pg_catalog.set_config' por padrão via RPC por segurança.
CREATE OR REPLACE FUNCTION public.set_config(name text, value text, is_local boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Permite execução com privilégios elevados para setar vars de sessão
AS $$
BEGIN
  -- Executa a função interna do PostgreSQL
  RETURN pg_catalog.set_config(name, value, is_local);
END;
$$;

-- Garantir que usuários autenticados (Next.js via service_role ou anon) possam chamar
GRANT EXECUTE ON FUNCTION public.set_config(text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_config(text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_config(text, text, boolean) TO anon;

COMMENT ON FUNCTION public.set_config IS 'Wrapper para pg_catalog.set_config para habilitar rastreamento de usuário em Auditoria/RLS via Supabase RPC.';
