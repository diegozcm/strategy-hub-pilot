-- Criar função para verificar se usuário é manager/admin no Strategy HUB
CREATE OR REPLACE FUNCTION public.is_strategy_hub_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_module_roles umr
    JOIN system_modules sm ON sm.id = umr.module_id
    WHERE umr.user_id = _user_id
      AND sm.slug = 'strategic-planning'
      AND umr.role IN ('admin', 'manager')
      AND umr.active = true
  );
$$;

-- Dropar políticas existentes de key_results
DROP POLICY IF EXISTS "Users can view company key results" ON key_results;
DROP POLICY IF EXISTS "Users can create company key results" ON key_results;
DROP POLICY IF EXISTS "Users can create key results" ON key_results;
DROP POLICY IF EXISTS "Users can update company key results" ON key_results;
DROP POLICY IF EXISTS "Users can update key results" ON key_results;
DROP POLICY IF EXISTS "Users can delete company key results" ON key_results;
DROP POLICY IF EXISTS "Users can delete key results" ON key_results;

-- Nova política SELECT: Managers/Admins veem todos, Members veem apenas seus KRs
CREATE POLICY "Users can view key results based on role"
ON key_results FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_plans sp ON sp.id = (
      SELECT so.plan_id FROM strategic_objectives so WHERE so.id = key_results.objective_id
    )
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
    AND (
      -- Managers e Admins veem todos os KRs da empresa
      is_strategy_hub_manager(auth.uid())
      OR
      -- Members veem apenas KRs onde são donos
      key_results.assigned_owner_id = auth.uid()
    )
  )
);

-- Política INSERT: Apenas Managers/Admins podem criar KRs
CREATE POLICY "Managers can create key results"
ON key_results FOR INSERT
TO authenticated
WITH CHECK (
  is_strategy_hub_manager(auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_plans sp ON sp.id = (
      SELECT so.plan_id FROM strategic_objectives so WHERE so.id = objective_id
    )
    WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
  )
);

-- Política UPDATE: Managers podem editar todos; Members podem editar apenas seus KRs (check-in)
CREATE POLICY "Users can update key results based on role"
ON key_results FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_plans sp ON sp.id = (
      SELECT so.plan_id FROM strategic_objectives so WHERE so.id = key_results.objective_id
    )
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
    AND (
      is_strategy_hub_manager(auth.uid())
      OR key_results.assigned_owner_id = auth.uid()
    )
  )
);

-- Política DELETE: Apenas Managers/Admins podem deletar KRs
CREATE POLICY "Managers can delete key results"
ON key_results FOR DELETE
TO authenticated
USING (
  is_strategy_hub_manager(auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_plans sp ON sp.id = (
      SELECT so.plan_id FROM strategic_objectives so WHERE so.id = key_results.objective_id
    )
    WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
  )
);