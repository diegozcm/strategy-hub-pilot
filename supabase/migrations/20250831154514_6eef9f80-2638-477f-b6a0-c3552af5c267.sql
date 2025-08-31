-- Fix profiles RLS policies to prevent infinite recursion
-- Create security definer function to safely check user roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT p.role::TEXT 
  FROM public.profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.status = 'active'
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create simplified policy using the security definer function
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT
USING (public.get_current_user_role() = 'admin');

-- Also simplify the company member view policy to avoid complex joins
DROP POLICY IF EXISTS "Users can view company member profiles" ON public.profiles;

-- Recreate with simpler logic
CREATE POLICY "Users can view company member profiles" ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = user_id 
    OR public.get_current_user_role() = 'admin'
    OR (
      company_id IS NOT NULL 
      AND company_id IN (
        SELECT ucr.company_id 
        FROM public.user_company_relations ucr 
        WHERE ucr.user_id = auth.uid()
      )
    )
  )
);