-- Atualizar política RLS de key_results para considerar configuração members_can_view_all

-- Remover política existente
DROP POLICY IF EXISTS "Users can view key results based on role" ON public.key_results;

-- Criar nova política que considera a configuração members_can_view_all
CREATE POLICY "Users can view key results based on role"
ON public.key_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_company_relations ucr
    JOIN strategic_plans sp ON sp.id = (
      SELECT so.plan_id FROM strategic_objectives so WHERE so.id = key_results.objective_id
    )
    WHERE ucr.user_id = auth.uid()
      AND ucr.company_id = sp.company_id
      AND (
        -- Condição 1: Manager/Admin vê todos os KRs
        is_strategy_hub_manager(auth.uid())
        
        -- Condição 2: Dono do KR sempre vê seu próprio KR
        OR key_results.assigned_owner_id = auth.uid()
        
        -- Condição 3: NOVO - Membro vê todos se configuração estiver ativa
        OR EXISTS (
          SELECT 1 FROM company_module_settings cms
          WHERE cms.company_id = sp.company_id
            AND cms.module_slug = 'strategic-planning'
            AND (cms.settings->>'members_can_view_all')::boolean = true
        )
      )
  )
);