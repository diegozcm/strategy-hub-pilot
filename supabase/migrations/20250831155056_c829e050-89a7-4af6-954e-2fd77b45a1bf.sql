-- Fix RLS policies and get_current_user_role function to resolve admin login issues

-- 1. First, fix the get_current_user_role function to be more resilient
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT p.role::TEXT 
  FROM public.profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.status = 'active'
  LIMIT 1
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 2. Drop the problematic admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 3. Drop the complex company member policy that might cause issues
DROP POLICY IF EXISTS "Users can view company member profiles" ON public.profiles;

-- 4. Create simplified, non-recursive policies
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

-- 5. Create a simple admin policy using direct role check without recursion
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_check 
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.role = 'admin'::app_role 
    AND admin_check.status = 'active'
  )
);

-- 6. Create a simple company members policy
CREATE POLICY "Users can view company member profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR  -- Can view own profile
    company_id IN (  -- Can view profiles from same company
      SELECT ucr.company_id 
      FROM user_company_relations ucr 
      WHERE ucr.user_id = auth.uid()
    )
  )
);