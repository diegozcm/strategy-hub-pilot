
-- Recriar view com SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.ai_usage_summary;

CREATE VIEW public.ai_usage_summary
WITH (security_invoker = true) AS
SELECT 
  date_trunc('day', created_at) as day,
  event_data->>'company_id' as company_id,
  event_data->>'model_used' as model,
  event_data->>'user_name' as user_name,
  user_id,
  event_type,
  COUNT(*) as call_count,
  COALESCE(SUM((event_data->>'prompt_tokens')::int), 0) as total_prompt_tokens,
  COALESCE(SUM((event_data->>'completion_tokens')::int), 0) as total_completion_tokens,
  COALESCE(SUM((event_data->>'total_tokens')::int), 0) as total_tokens
FROM public.ai_analytics
GROUP BY 1, 2, 3, 4, 5, 6;
