-- Clean inflated login logs: keep only the first login per user per day
-- This removes duplicate records caused by INITIAL_SESSION firing on every page refresh

DELETE FROM public.user_login_logs
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, DATE(login_time)) id
  FROM public.user_login_logs
  ORDER BY user_id, DATE(login_time), login_time ASC
);