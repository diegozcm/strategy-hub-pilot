-- Fix infinite recursion in profiles RLS policies

-- First, drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company colleagues can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Mentors can view assigned startup profiles" ON public.profiles;
DROP POLICY IF EXISTS "Startup users can view assigned mentor profiles" ON public.profiles;

-- Update is_system_admin function to avoid circular references
CREATE OR REPLACE FUNCTION public.is_system_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- Check hardcoded admin emails directly from auth.users
    WHEN EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = _user_id 
        AND au.email = ANY(ARRAY['admin@example.com', 'diego@cofound.com.br'])
    ) THEN true
    -- Or check if has admin role in user_roles table (avoid profiles table)
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = _user_id 
        AND ur.role = 'admin'::app_role
    ) THEN true
    ELSE false
  END;
$$;

-- Create simple, non-recursive RLS policies for profiles

-- 1. Users can always view and update their own profile (highest priority, simplest check)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. System admins can manage all profiles
CREATE POLICY "System admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.is_system_admin(auth.uid()));

-- 3. Company colleagues can view basic profile info (excluding sensitive fields)
CREATE POLICY "Company colleagues can view basic profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id AND -- Not their own profile (covered by policy #1)
  EXISTS (
    SELECT 1 FROM public.user_company_relations ucr1
    JOIN public.user_company_relations ucr2 ON ucr1.company_id = ucr2.company_id
    WHERE ucr1.user_id = auth.uid() 
      AND ucr2.user_id = profiles.user_id
  )
);

-- 4. Mentors can view their assigned startup profiles
CREATE POLICY "Mentors can view assigned startup profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id AND -- Not their own profile
  EXISTS (
    SELECT 1 FROM public.mentor_startup_relations msr
    JOIN public.user_company_relations ucr ON ucr.company_id = msr.startup_company_id
    WHERE msr.mentor_id = auth.uid() 
      AND ucr.user_id = profiles.user_id
      AND msr.status = 'active'
  )
);

-- 5. Startup users can view their assigned mentor profiles
CREATE POLICY "Startup users can view assigned mentor profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id AND -- Not their own profile
  EXISTS (
    SELECT 1 FROM public.mentor_startup_relations msr
    JOIN public.user_company_relations ucr ON ucr.company_id = msr.startup_company_id
    WHERE msr.mentor_id = profiles.user_id 
      AND ucr.user_id = auth.uid()
      AND msr.status = 'active'
  )
);

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;