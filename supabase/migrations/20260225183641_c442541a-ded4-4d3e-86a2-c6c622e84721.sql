
-- 1. ai_analytics: Add policy for system admins to view all analytics
CREATE POLICY "System admins can view all analytics"
  ON public.ai_analytics FOR SELECT
  USING (public.is_system_admin(auth.uid()));

-- 2. ai_model_pricing: Drop broken policies and recreate with auth.uid()
DROP POLICY IF EXISTS "System admins can view model pricing" ON public.ai_model_pricing;
DROP POLICY IF EXISTS "System admins can insert model pricing" ON public.ai_model_pricing;
DROP POLICY IF EXISTS "System admins can update model pricing" ON public.ai_model_pricing;
DROP POLICY IF EXISTS "System admins can delete model pricing" ON public.ai_model_pricing;

CREATE POLICY "System admins can view model pricing"
  ON public.ai_model_pricing FOR SELECT
  USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can insert model pricing"
  ON public.ai_model_pricing FOR INSERT
  WITH CHECK (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can update model pricing"
  ON public.ai_model_pricing FOR UPDATE
  USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can delete model pricing"
  ON public.ai_model_pricing FOR DELETE
  USING (public.is_system_admin(auth.uid()));
