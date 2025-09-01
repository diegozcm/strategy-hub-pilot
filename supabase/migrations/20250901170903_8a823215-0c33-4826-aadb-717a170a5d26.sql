-- ===============================================
-- REFATORAÇÃO COMPLETA DO SISTEMA DE AUTENTICAÇÃO
-- ===============================================

-- 1. Limpar políticas problemáticas da tabela profiles
DROP POLICY IF EXISTS "Company members can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Hardcoded admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 2. Recriar função has_role mais robusta
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Primeiro verifica admins hardcoded
  SELECT CASE
    WHEN _user_id IN (
      SELECT au.id FROM auth.users au 
      WHERE au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
    ) THEN true
    -- Depois verifica no profiles
    ELSE EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = _user_id 
        AND p.role = _role 
        AND p.status = 'active'
    )
  END;
$$;

-- 3. Criar função específica para verificar admin
CREATE OR REPLACE FUNCTION public.is_system_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- Admins hardcoded sempre têm acesso
    WHEN _user_id IN (
      SELECT au.id FROM auth.users au 
      WHERE au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
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

-- 4. Criar RLS policies simples e funcionais para profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can manage all profiles" 
ON public.profiles FOR ALL 
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

-- 5. Melhorar função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  user_role TEXT := 'member';
BEGIN
  -- Count total users para determinar se é primeiro usuário
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Determinar role baseado no email
  IF NEW.email = 'admin@example.com' OR NEW.email = 'diego@cofound.com.br' THEN
    user_role := 'admin';
  ELSIF user_count = 1 THEN
    user_role := 'admin'; -- Primeiro usuário é sempre admin
  ELSE
    user_role := 'member';
  END IF;

  -- Inserir perfil (sempre ativo para admins, pending para outros)
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

  -- Inserir na tabela user_roles se necessário
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 6. Recriar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();