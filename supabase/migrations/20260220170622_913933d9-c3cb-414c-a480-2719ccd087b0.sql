
DROP FUNCTION IF EXISTS public.get_company_users(uuid);

CREATE FUNCTION public.get_company_users(_company_id uuid)
 RETURNS TABLE(user_id uuid, first_name text, last_name text, email text, avatar_url text, status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.avatar_url,
    p.status
  FROM user_company_relations ucr
  JOIN profiles p ON p.user_id = ucr.user_id
  WHERE ucr.company_id = _company_id
    AND (
      user_belongs_to_company(auth.uid(), _company_id)
      OR is_system_admin(auth.uid())
    )
  ORDER BY p.first_name, p.last_name;
$$;
