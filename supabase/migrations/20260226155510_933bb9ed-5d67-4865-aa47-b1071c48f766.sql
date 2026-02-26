
-- ============================================
-- Fase 1a: Remove duplicate BROKEN policies from ai_model_pricing
-- ============================================
DROP POLICY IF EXISTS "System admins can read pricing" ON public.ai_model_pricing;
DROP POLICY IF EXISTS "System admins can insert pricing" ON public.ai_model_pricing;
DROP POLICY IF EXISTS "System admins can update pricing" ON public.ai_model_pricing;
DROP POLICY IF EXISTS "System admins can delete pricing" ON public.ai_model_pricing;

-- ============================================
-- Fase 1b: Admin policy on ai_chat_sessions (SELECT all)
-- ============================================
CREATE POLICY "System admins can view all chat sessions"
  ON public.ai_chat_sessions FOR SELECT
  USING (public.is_system_admin(auth.uid()));

-- ============================================
-- Fase 1c: Create ai_pricing_history table
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_pricing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  input_cost_per_million numeric NOT NULL,
  output_cost_per_million numeric NOT NULL,
  usd_to_brl_rate numeric NOT NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_until date,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_pricing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can view pricing history"
  ON public.ai_pricing_history FOR SELECT
  USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can insert pricing history"
  ON public.ai_pricing_history FOR INSERT
  WITH CHECK (public.is_system_admin(auth.uid()));

-- ============================================
-- Fase 1e: Create ai_usage_limits table
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('company', 'user')),
  target_id uuid NOT NULL,
  max_tokens_per_month bigint,
  max_cost_brl_per_month numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(target_type, target_id)
);

ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage usage limits"
  ON public.ai_usage_limits FOR ALL
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));
