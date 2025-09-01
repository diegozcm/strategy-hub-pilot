-- Corrigir políticas RLS que ainda referenciam auth.users

-- Remover políticas problemáticas na tabela user_company_relations
DROP POLICY IF EXISTS "Admins can insert company relations" ON user_company_relations;
DROP POLICY IF EXISTS "Admins can manage all company relations" ON user_company_relations;

-- Criar políticas corrigidas usando is_system_admin
CREATE POLICY "System admins can manage company relations"
ON user_company_relations
FOR ALL
TO authenticated
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Corrigir função has_role para não acessar auth.users diretamente
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Verificar diretamente no profiles
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id 
      AND p.role = _role 
      AND p.status = 'active'
  );
$$;

-- Atualizar função is_system_admin para não usar auth.users
CREATE OR REPLACE FUNCTION public.is_system_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- Verificar admins hardcoded por email no profiles
    WHEN _user_id IN (
      SELECT p.user_id FROM public.profiles p 
      WHERE p.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
        AND p.status = 'active'
    ) THEN true
    -- Ou se tem role admin no profiles
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = _user_id 
        AND p.role = 'admin'::app_role 
        AND p.status = 'active'
    ) THEN true
    ELSE false
  END;
$$;

-- Melhorar função handle_new_user para ser mais robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count INTEGER := 0;
  user_role TEXT := 'member';
BEGIN
  -- Determinar role baseado no email
  IF NEW.email = 'admin@example.com' OR NEW.email = 'diego@cofound.com.br' THEN
    user_role := 'admin';
  ELSE
    -- Contar usuários existentes para determinar se é primeiro
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    IF user_count = 0 THEN
      user_role := 'admin'; -- Primeiro usuário é sempre admin
    ELSE
      user_role := 'member';
    END IF;
  END IF;

  -- Inserir perfil sempre como ativo para admins, pending para outros
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    email, 
    role,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    NEW.email,
    user_role::public.app_role,
    CASE 
      WHEN user_role = 'admin' THEN 'active'
      ELSE 'pending'
    END,
    now(),
    now()
  );

  -- Inserir na tabela user_roles
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (NEW.id, user_role::public.app_role, now(), now())
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error mas continue sem falhar
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;