-- PLANO DE RECUPERAÇÃO COMPLETA (Versão Segura)
-- Substituir função problemática e simplificar políticas da tabela profiles

-- FASE 1: SUBSTITUIR função has_role por versão sem recursão
-- (sem dropar, apenas substituir implementação)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Primeira verificação: admins hardcoded por email (direto do auth.users)
  SELECT EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = _user_id 
      AND au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  ) OR
  -- Segunda verificação: roles na tabela user_roles (sem usar profiles)
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;

-- FASE 2: LIMPAR políticas problemáticas APENAS da tabela profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas da tabela profiles (que causam recursão)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles; 
DROP POLICY IF EXISTS "Hardcoded admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Hardcoded admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company colleagues can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "System admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company colleagues can view basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company colleagues can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Mentors can view assigned startup profiles" ON public.profiles;
DROP POLICY IF EXISTS "Startup users can view assigned mentor profiles" ON public.profiles;
DROP POLICY IF EXISTS "Hardcoded admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Hardcoded admins can delete profiles" ON public.profiles;

-- FASE 3: CRIAR políticas ultra-simples para profiles (sem recursão)

-- 1. Usuários podem ver/editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Admins hardcoded (verificação direta no auth.users - sem recursão)
CREATE POLICY "System admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
      AND au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  )
);

CREATE POLICY "System admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
      AND au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  )
);

CREATE POLICY "System admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
      AND au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  )
);

CREATE POLICY "System admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
      AND au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  )
);

-- FASE 4: REABILITAR RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;