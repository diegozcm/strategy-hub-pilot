-- Fix the get_current_user_role function to have proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT p.role::TEXT 
  FROM public.profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.status = 'active'
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;