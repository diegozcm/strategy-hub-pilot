-- Fase 1: Correção Estrutural do Banco

-- 1. Adicionar foreign key constraint entre kr_monthly_actions e kr_fca
ALTER TABLE public.kr_monthly_actions 
ADD CONSTRAINT fk_kr_monthly_actions_fca_id 
FOREIGN KEY (fca_id) REFERENCES public.kr_fca(id) ON DELETE CASCADE;

-- 2. Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_kr_monthly_actions_fca_id ON public.kr_monthly_actions(fca_id);
CREATE INDEX IF NOT EXISTS idx_kr_monthly_actions_key_result_id ON public.kr_monthly_actions(key_result_id);

-- 3. Criar função para validar FCA existe antes de criar ação
CREATE OR REPLACE FUNCTION public.validate_fca_for_action(_fca_id uuid, _key_result_id uuid)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o FCA existe e pertence ao mesmo key_result
  IF NOT EXISTS (
    SELECT 1 FROM public.kr_fca 
    WHERE id = _fca_id 
    AND key_result_id = _key_result_id 
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'FCA não encontrado ou não pertence ao resultado chave especificado';
  END IF;
  
  RETURN true;
END;
$$;

-- 4. Atualizar políticas RLS para kr_monthly_actions (simplificar)
DROP POLICY IF EXISTS "Users can create KR actions for their company" ON public.kr_monthly_actions;
DROP POLICY IF EXISTS "Users can view KR actions for their company" ON public.kr_monthly_actions;
DROP POLICY IF EXISTS "Users can update KR actions for their company" ON public.kr_monthly_actions;
DROP POLICY IF EXISTS "Users can delete KR actions for their company" ON public.kr_monthly_actions;

-- Novas políticas RLS mais simples e eficientes
CREATE POLICY "Users can create KR monthly actions for company FCAs" 
ON public.kr_monthly_actions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kr_fca kf
    JOIN public.key_results kr ON kr.id = kf.key_result_id
    JOIN public.strategic_objectives so ON so.id = kr.objective_id
    JOIN public.strategic_plans sp ON sp.id = so.plan_id
    JOIN public.user_company_relations ucr ON ucr.company_id = sp.company_id
    WHERE kf.id = kr_monthly_actions.fca_id 
    AND ucr.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can view KR monthly actions for company FCAs" 
ON public.kr_monthly_actions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.kr_fca kf
    JOIN public.key_results kr ON kr.id = kf.key_result_id
    JOIN public.strategic_objectives so ON so.id = kr.objective_id
    JOIN public.strategic_plans sp ON sp.id = so.plan_id
    JOIN public.user_company_relations ucr ON ucr.company_id = sp.company_id
    WHERE kf.id = kr_monthly_actions.fca_id 
    AND ucr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update KR monthly actions for company FCAs" 
ON public.kr_monthly_actions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.kr_fca kf
    JOIN public.key_results kr ON kr.id = kf.key_result_id
    JOIN public.strategic_objectives so ON so.id = kr.objective_id
    JOIN public.strategic_plans sp ON sp.id = so.plan_id
    JOIN public.user_company_relations ucr ON ucr.company_id = sp.company_id
    WHERE kf.id = kr_monthly_actions.fca_id 
    AND ucr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete KR monthly actions for company FCAs" 
ON public.kr_monthly_actions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.kr_fca kf
    JOIN public.key_results kr ON kr.id = kf.key_result_id
    JOIN public.strategic_objectives so ON so.id = kr.objective_id
    JOIN public.strategic_plans sp ON sp.id = so.plan_id
    JOIN public.user_company_relations ucr ON ucr.company_id = sp.company_id
    WHERE kf.id = kr_monthly_actions.fca_id 
    AND ucr.user_id = auth.uid()
  )
);