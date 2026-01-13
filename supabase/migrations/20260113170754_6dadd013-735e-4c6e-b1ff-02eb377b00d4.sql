-- Remover políticas antigas com emails hardcoded
DROP POLICY IF EXISTS "admin_all_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "admin_all_profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "admin_all_profiles_delete" ON public.profiles;

-- Criar novas políticas usando is_system_admin() como fonte de verdade
CREATE POLICY "admin_all_profiles_select" 
  ON public.profiles 
  FOR SELECT 
  TO public
  USING (is_system_admin(auth.uid()));

CREATE POLICY "admin_all_profiles_update" 
  ON public.profiles 
  FOR UPDATE 
  TO public
  USING (is_system_admin(auth.uid()));

CREATE POLICY "admin_all_profiles_delete" 
  ON public.profiles 
  FOR DELETE 
  TO public
  USING (is_system_admin(auth.uid()));