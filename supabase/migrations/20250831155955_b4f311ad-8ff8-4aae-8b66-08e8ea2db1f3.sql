-- FASE 1: Correção definitiva do backend
-- Remover função problemática e recriar de forma mais robusta

-- 1. Remover função existente
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- 2. Recriar função sem dependências de RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
BEGIN
  -- Primeiro, tentar pegar role diretamente por auth.uid()
  SELECT p.role::TEXT INTO user_role 
  FROM public.profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.status = 'active'
  LIMIT 1;
  
  -- Se encontrou, retornar
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;
  
  -- Fallback: verificar se é admin por email (para casos de perfil não carregado)
  SELECT au.email INTO user_email 
  FROM auth.users au 
  WHERE au.id = auth.uid();
  
  IF user_email IN ('admin@example.com', 'diego@cofound.com.br') THEN
    RETURN 'admin';
  END IF;
  
  -- Default
  RETURN 'member';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 3. Remover TODAS as políticas RLS da tabela profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view company member profiles" ON public.profiles;

-- 4. Recriar políticas mais simples e sem recursão
-- Política 1: Usuários podem ver próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

-- Política 2: Admins por email podem ver tudo (sem usar função recursiva)
CREATE POLICY "Admins can view all profiles" ON public.profiles  
FOR SELECT USING (
  auth.uid() IN (
    SELECT au.id FROM auth.users au 
    WHERE au.email IN ('admin@example.com', 'diego@cofound.com.br')
  )
);

-- Política 3: Usuários da mesma empresa podem se ver
CREATE POLICY "Company members can view profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  company_id IS NOT NULL AND 
  company_id IN (
    SELECT ucr.company_id 
    FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid()
  )
);