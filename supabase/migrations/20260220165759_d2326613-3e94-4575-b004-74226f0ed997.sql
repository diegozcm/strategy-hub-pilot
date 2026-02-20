
-- Create a function to get deduplicated login logs (one per user per 30-min window)
CREATE OR REPLACE FUNCTION public.get_deduplicated_login_logs(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  login_time TIMESTAMPTZ,
  logout_time TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  company_id UUID
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (
    ull.user_id, 
    date_trunc('hour', ull.login_time) + INTERVAL '30 min' * FLOOR(EXTRACT(MINUTE FROM ull.login_time) / 30)
  )
    ull.id,
    ull.user_id,
    ull.login_time,
    ull.logout_time,
    ull.ip_address,
    ull.user_agent,
    ull.company_id
  FROM user_login_logs ull
  WHERE (p_start_date IS NULL OR ull.login_time >= p_start_date)
  ORDER BY 
    ull.user_id, 
    date_trunc('hour', ull.login_time) + INTERVAL '30 min' * FLOOR(EXTRACT(MINUTE FROM ull.login_time) / 30),
    ull.login_time ASC
  LIMIT p_limit;
$$;

-- Also clean up historical duplicate data
DELETE FROM user_login_logs
WHERE id NOT IN (
  SELECT DISTINCT ON (
    user_id, 
    date_trunc('hour', login_time) + INTERVAL '30 min' * FLOOR(EXTRACT(MINUTE FROM login_time) / 30)
  )
    id
  FROM user_login_logs
  ORDER BY 
    user_id, 
    date_trunc('hour', login_time) + INTERVAL '30 min' * FLOOR(EXTRACT(MINUTE FROM login_time) / 30),
    login_time ASC
);
