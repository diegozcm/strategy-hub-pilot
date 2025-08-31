-- Fix RLS policies for profiles table to ensure admin@example.com can access their profile

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Company members can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create new, simpler policies that work properly

-- 1. Users can always view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Hardcoded admin emails can view all profiles (including their own)
CREATE POLICY "Hardcoded admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email IN ('admin@example.com', 'diego@cofound.com.br')
  )
);

-- 3. Company members can view profiles in same company
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

-- 4. Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Users can update their own profile OR admins can update any profile
CREATE POLICY "Users can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR auth.uid() IN (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email IN ('admin@example.com', 'diego@cofound.com.br')
  )
);