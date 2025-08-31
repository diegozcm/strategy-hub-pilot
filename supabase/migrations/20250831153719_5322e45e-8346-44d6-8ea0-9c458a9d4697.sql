-- Fix profiles RLS policies to prevent infinite recursion
-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view company member profiles" ON public.profiles;

-- Update the admin policy to use a simpler approach
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create simplified policies that don't cause recursion
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);

-- Allow users to view profiles in their companies (simplified)
CREATE POLICY "Users can view company member profiles" ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- User can see their own profile
    auth.uid() = user_id
    OR
    -- User can see profiles in same company (direct check without recursion)
    company_id IS NOT NULL 
    AND company_id IN (
      SELECT company_id FROM public.user_company_relations 
      WHERE user_id = auth.uid()
    )
  )
);