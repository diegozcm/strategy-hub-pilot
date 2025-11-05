-- FASE 3: Remover emails hardcoded da função is_system_admin()
-- Atualizar função para usar APENAS verificação via user_roles

CREATE OR REPLACE FUNCTION public.is_system_admin(_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = COALESCE(_user_id, auth.uid())
      AND role = 'admin'::app_role
  );
$$;