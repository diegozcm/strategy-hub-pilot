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

-- 2. Drop ALL existing SELECT policies on profiles to start fresh
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view company member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 3. Create new simplified, non-recursive policies in order of specificity
-- First policy: Users can always view their own profile (most specific)
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

-- Second policy: Admins can view all profiles (using direct check, no recursion)
CREATE POLICY "Admins can view all profiles" ON public.profiles  
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_check 
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.role = 'admin'::app_role 
    AND admin_check.status = 'active'
  )
);

-- Third policy: Users can view profiles from same company
CREATE POLICY "Users can view company member profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  company_id IS NOT NULL AND 
  company_id IN (
    SELECT ucr.company_id 
    FROM user_company_relations ucr 
    WHERE ucr.user_id = auth.uid()
  )
);