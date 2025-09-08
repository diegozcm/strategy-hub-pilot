-- Revert to functional RLS policies for profiles table
-- Remove all complex policies causing infinite recursion

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company colleagues can view basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company colleagues can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Mentors can view assigned startup profiles" ON public.profiles;
DROP POLICY IF EXISTS "Startup users can view assigned mentor profiles" ON public.profiles;

-- Create simple, functional RLS policies without recursion

-- 1. Users can view and update their own profile (basic security)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Hardcoded admins can view and manage all profiles (direct email check)
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

-- 3. Company colleagues can view basic profile info (simple JOIN)
CREATE POLICY "Company colleagues can view profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id AND -- Not their own profile
  EXISTS (
    SELECT 1 FROM public.user_company_relations ucr1
    WHERE ucr1.user_id = auth.uid() 
      AND EXISTS (
        SELECT 1 FROM public.user_company_relations ucr2
        WHERE ucr2.user_id = profiles.user_id 
          AND ucr2.company_id = ucr1.company_id
      )
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;