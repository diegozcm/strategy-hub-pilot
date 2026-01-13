-- Function to get MFA status for a list of user IDs
-- Uses SECURITY DEFINER to safely access auth.mfa_factors
CREATE OR REPLACE FUNCTION public.get_admin_mfa_status(user_ids uuid[])
RETURNS TABLE(user_id uuid, has_mfa boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT 
    u.user_id,
    EXISTS(
      SELECT 1 FROM auth.mfa_factors mf 
      WHERE mf.user_id = u.user_id 
      AND mf.status = 'verified'
    ) as has_mfa
  FROM unnest(user_ids) AS u(user_id);
$$;