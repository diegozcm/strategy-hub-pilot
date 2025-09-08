-- EMERGÊNCIA - Eliminação TOTAL da recursão infinita
-- Desabilitar RLS e criar políticas absolutamente mínimas

-- FASE 1: DESABILITAR RLS COMPLETAMENTE
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- FASE 2: REMOVER TODAS AS POLÍTICAS EXISTENTES (garantir limpeza total)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- FASE 3: CRIAR POLÍTICAS SUPER SIMPLES (sem qualquer possibilidade de recursão)

-- 1. Usuários podem ver apenas o próprio perfil (direto, sem subquery)
CREATE POLICY "users_own_profile_select" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Usuários podem atualizar apenas o próprio perfil
CREATE POLICY "users_own_profile_update" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Admin hardcoded (verificação direta no JWT, sem subquery da auth.users)
CREATE POLICY "admin_all_profiles_select" 
ON public.profiles 
FOR SELECT 
USING (
  auth.jwt() ->> 'email' = 'admin@example.com' OR 
  auth.jwt() ->> 'email' = 'diego@cofound.com.br'
);

CREATE POLICY "admin_all_profiles_update" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.jwt() ->> 'email' = 'admin@example.com' OR 
  auth.jwt() ->> 'email' = 'diego@cofound.com.br'
);

CREATE POLICY "admin_all_profiles_insert" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.jwt() ->> 'email' = 'admin@example.com' OR 
  auth.jwt() ->> 'email' = 'diego@cofound.com.br'
);

CREATE POLICY "admin_all_profiles_delete" 
ON public.profiles 
FOR DELETE 
USING (
  auth.jwt() ->> 'email' = 'admin@example.com' OR 
  auth.jwt() ->> 'email' = 'diego@cofound.com.br'
);

-- FASE 4: REABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- TESTAR as políticas criadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause_check,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;