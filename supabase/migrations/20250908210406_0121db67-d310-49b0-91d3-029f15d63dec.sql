-- PLANO DE RECUPERAÇÃO COMPLETA - Eliminar recursão infinita e restaurar acesso

-- FASE 1: LIMPEZA COMPLETA
-- Desabilitar RLS temporariamente para limpeza segura
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes da tabela profiles
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

-- Remover função problemática que causa recursão
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Criar nova função has_role que usa user_roles ao invés de profiles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  ) OR EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = _user_id 
      AND au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  );
$$;

-- FASE 2: POLÍTICAS ULTRA-SIMPLES (sem recursão)

-- 1. Auto-acesso: usuários podem ver/editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Admins hardcoded podem ver e gerenciar todos os perfis (direto do auth.users)
CREATE POLICY "Hardcoded admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
      AND au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  )
);

CREATE POLICY "Hardcoded admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
      AND au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  )
);

CREATE POLICY "Hardcoded admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
      AND au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  )
);

CREATE POLICY "Hardcoded admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
      AND au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  )
);

-- FASE 3: REABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verificar que as políticas foram aplicadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';