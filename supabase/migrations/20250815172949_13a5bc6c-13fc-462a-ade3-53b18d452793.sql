
-- Fix infinite recursion in profiles RLS policy
-- The current "Users can view company profiles" policy causes recursion
-- by querying the same table it's protecting within the USING clause

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view company profiles" ON public.profiles;

-- Create a new policy that uses user_company_relations table instead
-- This avoids the recursion issue while maintaining security
CREATE POLICY "Users can view company member profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- User can see profiles of people in companies they belong to
    company_id IN (
      SELECT ucr.company_id 
      FROM public.user_company_relations ucr 
      WHERE ucr.user_id = auth.uid()
    )
    OR
    -- Also allow if the profile has company_id matching user's company_id from their own profile
    -- But we need to do this safely without recursion
    EXISTS (
      SELECT 1 
      FROM public.user_company_relations ucr1
      JOIN public.user_company_relations ucr2 ON ucr1.company_id = ucr2.company_id
      WHERE ucr1.user_id = auth.uid() 
      AND ucr2.user_id = profiles.user_id
    )
  )
);
