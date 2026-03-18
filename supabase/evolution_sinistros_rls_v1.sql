-- ============================================================
-- SQL MIGRATION: SECURITY FIX FOR public.sinistros
-- ============================================================

-- 1. Enable Row Level Security (RLS)
-- This blocks all public (anon) access by default.
ALTER TABLE public.sinistros ENABLE ROW LEVEL SECURITY;

-- 2. Force RLS for all users, including service_role/admin
-- This ensures that even the Next.js API (BFF) follows the rules defined here,
-- providing a second layer of defense.
-- Note: We only do this if we are confident the session context is always set.
-- Given the audit.current_user_id is already used for auditing, it makes sense.
ALTER TABLE public.sinistros FORCE ROW LEVEL SECURITY;

-- 3. Helper Function to get current user ID from session
-- This handles both standard Supabase Auth (auth.uid()) 
-- and the custom NextAuth/BFF context (audit.current_user_id).
CREATE OR REPLACE FUNCTION public.fn_get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    NULLIF(current_setting('audit.current_user_id', true), '')::UUID,
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Helper Function to get current user perfil
CREATE OR REPLACE FUNCTION public.fn_get_current_user_perfil()
RETURNS public.perfil_usuario AS $$
DECLARE
  v_perfil public.perfil_usuario;
  v_user_id UUID;
BEGIN
  v_user_id := public.fn_get_current_user_id();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT perfil INTO v_perfil FROM public.usuarios WHERE id = v_user_id;
  RETURN v_perfil;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "sinistros_select_policy" ON public.sinistros;
DROP POLICY IF EXISTS "sinistros_insert_policy" ON public.sinistros;
DROP POLICY IF EXISTS "sinistros_update_policy" ON public.sinistros;
DROP POLICY IF EXISTS "sinistros_delete_policy" ON public.sinistros;

-- 6. Policy for SELECT
-- RULES:
-- - Global roles (admin, diretoria, analista, auditoria, financeiro) see all.
-- - Managers see where gerente_operacoes_id matches.
-- - Supervisors see where supervisor_id matches.
-- - Creators see where criado_por_id matches.
CREATE POLICY "sinistros_select_policy" ON public.sinistros
FOR SELECT
USING (
  (public.fn_get_current_user_perfil() IN ('administrador', 'diretoria', 'analista_sinistro', 'auditoria', 'financeiro'))
  OR (gerente_operacoes_id = public.fn_get_current_user_id())
  OR (supervisor_id = public.fn_get_current_user_id())
  OR (criado_por_id = public.fn_get_current_user_id())
);

-- 7. Policy for INSERT
-- Any authenticated user can insert (the application logic handles the creation).
CREATE POLICY "sinistros_insert_policy" ON public.sinistros
FOR INSERT
WITH CHECK (
  public.fn_get_current_user_id() IS NOT NULL
);

-- 8. Policy for UPDATE
-- RULES:
-- - Global roles can update.
-- - Managers/Supervisors can update their own.
CREATE POLICY "sinistros_update_policy" ON public.sinistros
FOR UPDATE
USING (
  (public.fn_get_current_user_perfil() IN ('administrador', 'diretoria', 'analista_sinistro', 'auditoria', 'financeiro'))
  OR (gerente_operacoes_id = public.fn_get_current_user_id())
  OR (supervisor_id = public.fn_get_current_user_id())
);

-- 9. Policy for DELETE
-- Restricted to administrador only for safety.
CREATE POLICY "sinistros_delete_policy" ON public.sinistros
FOR DELETE
USING (
  public.fn_get_current_user_perfil() = 'administrador'
);

-- 10. Repeat for related tables (anexos, historico_sinistros, inconsistencias)
-- These should also be protected as they contain sensitive sinistro data.

-- ANEXOS
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos FORCE ROW LEVEL SECURITY;

CREATE POLICY "anexos_select_policy" ON public.anexos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sinistros WHERE id = anexos.sinistro_id)
);
CREATE POLICY "anexos_insert_policy" ON public.anexos FOR INSERT WITH CHECK (
  public.fn_get_current_user_id() IS NOT NULL
);
CREATE POLICY "anexos_delete_policy" ON public.anexos FOR DELETE USING (
  public.fn_get_current_user_perfil() = 'administrador' OR usuario_id = public.fn_get_current_user_id()
);

-- HISTORICO
ALTER TABLE public.historico_sinistros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_sinistros FORCE ROW LEVEL SECURITY;

CREATE POLICY "historico_select_policy" ON public.historico_sinistros FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sinistros WHERE id = historico_sinistros.sinistro_id)
);
CREATE POLICY "historico_insert_policy" ON public.historico_sinistros FOR INSERT WITH CHECK (
  public.fn_get_current_user_id() IS NOT NULL
);

-- INCONSISTENCIAS
ALTER TABLE public.inconsistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inconsistencias FORCE ROW LEVEL SECURITY;

CREATE POLICY "inconsistencias_select_policy" ON public.inconsistencias FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sinistros WHERE id = inconsistencias.sinistro_id)
);
CREATE POLICY "inconsistencias_insert_policy" ON public.inconsistencias FOR INSERT WITH CHECK (
  public.fn_get_current_user_id() IS NOT NULL
);
CREATE POLICY "inconsistencias_update_policy" ON public.inconsistencias FOR UPDATE USING (
  public.fn_get_current_user_perfil() IN ('administrador', 'analista_sinistro', 'gerente_operacoes')
);
