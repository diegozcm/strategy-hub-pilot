-- Fix security issue: Restrict profiles table access
-- Currently any authenticated user can see all profiles, which is a privacy violation

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policies for profiles table
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Admins can view all profiles (needed for admin functionality)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy 3: Users can view profiles of people in their company (for project/objective ownership display)
CREATE POLICY "Users can view company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND company_id IS NOT NULL 
  AND company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND company_id IS NOT NULL
  )
);