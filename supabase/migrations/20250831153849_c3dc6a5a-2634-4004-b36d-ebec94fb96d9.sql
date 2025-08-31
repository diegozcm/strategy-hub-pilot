-- Fix user_company_relations RLS policies to prevent infinite recursion
-- Drop problematic policies that cause circular references
DROP POLICY IF EXISTS "Admin can manage all company relations" ON public.user_company_relations;
DROP POLICY IF EXISTS "Users can view their own company relations" ON public.user_company_relations;

-- Create simplified policies without circular references
-- Simple admin check using auth metadata or direct user_id check
CREATE POLICY "Admins can manage all company relations" ON public.user_company_relations
FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Check if user is in a specific admin user list (replace with actual admin user IDs)
    auth.uid() IN (
      SELECT au.id FROM auth.users au 
      WHERE au.email IN ('admin@example.com', 'diego@cofound.com.br')
    )
  )
);

-- Allow users to view their own relations without circular reference
CREATE POLICY "Users can view their own company relations" ON public.user_company_relations
FOR SELECT
USING (user_id = auth.uid());

-- Allow admins to insert company relations (simplified check)
CREATE POLICY "Admins can insert company relations" ON public.user_company_relations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() IN (
      SELECT au.id FROM auth.users au 
      WHERE au.email IN ('admin@example.com', 'diego@cofound.com.br')
    )
  )
);