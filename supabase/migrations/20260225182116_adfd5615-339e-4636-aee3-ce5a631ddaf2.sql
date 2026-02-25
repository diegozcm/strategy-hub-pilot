
-- Tabela de preços por modelo de IA
CREATE TABLE public.ai_model_pricing (
  model_name VARCHAR(100) PRIMARY KEY,
  input_cost_per_million NUMERIC(10, 4) NOT NULL DEFAULT 0,
  output_cost_per_million NUMERIC(10, 4) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  usd_to_brl_rate NUMERIC(10, 4) NOT NULL DEFAULT 5.80,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_model_pricing ENABLE ROW LEVEL SECURITY;

-- Somente system admins podem ler/modificar preços
CREATE POLICY "System admins can read pricing"
  ON public.ai_model_pricing FOR SELECT
  USING (public.is_system_admin());

CREATE POLICY "System admins can insert pricing"
  ON public.ai_model_pricing FOR INSERT
  WITH CHECK (public.is_system_admin());

CREATE POLICY "System admins can update pricing"
  ON public.ai_model_pricing FOR UPDATE
  USING (public.is_system_admin());

CREATE POLICY "System admins can delete pricing"
  ON public.ai_model_pricing FOR DELETE
  USING (public.is_system_admin());

-- Seed com preços atuais dos modelos
INSERT INTO public.ai_model_pricing (model_name, input_cost_per_million, output_cost_per_million) VALUES
  ('google/gemini-3-flash-preview', 0.10, 0.40),
  ('google/gemini-2.5-pro', 1.25, 10.00),
  ('google/gemini-2.5-flash', 0.15, 0.60);

-- View de agregação de uso
CREATE OR REPLACE VIEW public.ai_usage_summary AS
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
