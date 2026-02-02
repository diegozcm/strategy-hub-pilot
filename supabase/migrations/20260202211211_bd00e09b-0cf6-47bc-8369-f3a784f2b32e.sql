-- =============================================================
-- Migration: Ajustar RLS para Membros Sempre Verem KRs
-- =============================================================

-- 1. Simplificar política SELECT de key_results
-- Qualquer usuário da empresa pode ver todos os KRs (sem depender de configuração)
DROP POLICY IF EXISTS "Users can view key results based on role" ON public.key_results;

CREATE POLICY "Company users can view all key results"
ON public.key_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_company_relations ucr
    JOIN strategic_objectives so ON so.id = key_results.objective_id
    JOIN strategic_plans sp ON sp.id = so.plan_id
    WHERE ucr.user_id = auth.uid()
    AND ucr.company_id = sp.company_id
  )
);

-- 2. Restringir políticas de kr_initiatives para managers/admins apenas
-- DROP das políticas antigas
DROP POLICY IF EXISTS "Users can create company KR initiatives" ON public.kr_initiatives;
DROP POLICY IF EXISTS "Users can update company KR initiatives" ON public.kr_initiatives;
DROP POLICY IF EXISTS "Users can delete company KR initiatives" ON public.kr_initiatives;

-- INSERT (apenas managers/admins)
CREATE POLICY "Managers can create KR initiatives"
ON public.kr_initiatives
FOR INSERT
TO authenticated
WITH CHECK (
  is_strategy_hub_manager(auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
  AND created_by = auth.uid()
);

-- UPDATE (apenas managers/admins)
CREATE POLICY "Managers can update KR initiatives"
ON public.kr_initiatives
FOR UPDATE
TO authenticated
USING (
  is_strategy_hub_manager(auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
);

-- DELETE (apenas managers/admins)
CREATE POLICY "Managers can delete KR initiatives"
ON public.kr_initiatives
FOR DELETE
TO authenticated
USING (
  is_strategy_hub_manager(auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
);