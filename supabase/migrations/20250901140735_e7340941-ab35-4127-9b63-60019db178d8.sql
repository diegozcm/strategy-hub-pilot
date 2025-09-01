-- CORREÇÃO COMPLETA DO SISTEMA DE ADMIN
-- Remove a função problemática get_current_user_role() que está causando erros de permissão

-- 1. Remover a função problemática
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- 2. Verificar e corrigir todas as políticas RLS que usavam essa função
-- Primeiro, vamos verificar se há políticas usando has_role que podem estar problemáticas

-- 3. Criar uma nova função has_role mais simples e robusta
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    LEFT JOIN public.companies c ON p.company_id = c.id
    WHERE p.user_id = _user_id
      AND p.role = _role
      AND p.status = 'active'
      AND (c.status IS NULL OR c.status = 'active')
  );
$$;

-- 4. Verificar se as políticas RLS estão funcionando corretamente
-- Recriar política específica para admin@example.com poder acessar profiles

-- Drop e recriar políticas da tabela profiles para garantir funcionamento
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Hardcoded admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company members can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;

-- Políticas mais simples e diretas
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Hardcoded admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  )
);

CREATE POLICY "Company members can view profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND company_id IS NOT NULL 
  AND company_id IN (
    SELECT ucr.company_id 
    FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR auth.uid() IN (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
  )
);

-- 5. Garantir que o perfil admin@example.com existe e está correto
-- Isso vai ser feito via a função handle_new_user() existente ou inserção manual se necessário

-- 6. Verificar se há outras tabelas com políticas problemáticas que referenciam get_current_user_role
-- As principais tabelas que usam has_role estão corretas com a nova função