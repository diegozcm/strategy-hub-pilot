-- =====================================================
-- CRITICAL SECURITY FIX: AI Insights & Recommendations
-- =====================================================
-- PROBLEMA: Usuários viam insights de outras empresas e de outros usuários
-- SOLUÇÃO: Garantir que auth.uid() = user_id E verificar company_id

-- =====================================================
-- 1. FIX AI_INSIGHTS TABLE
-- =====================================================

-- Drop políticas inseguras existentes
DROP POLICY IF EXISTS "Users can view insights from their company" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can insert their own insights" ON public.ai_insights;

-- Criar políticas SEGURAS que verificam user_id E company_id
CREATE POLICY "Users can only view their own insights in their company"
ON public.ai_insights
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND (
    company_id IS NULL 
    OR company_id IN (
      SELECT company_id 
      FROM public.user_company_relations 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can only insert their own insights"
ON public.ai_insights
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    company_id IS NULL 
    OR company_id IN (
      SELECT company_id 
      FROM public.user_company_relations 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can only update their own insights"
ON public.ai_insights
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own insights"
ON public.ai_insights
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- 2. FIX AI_RECOMMENDATIONS TABLE
-- =====================================================

-- Drop políticas inseguras existentes
DROP POLICY IF EXISTS "Users can view recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can update their recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can delete their recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can insert recommendations" ON public.ai_recommendations;

-- Criar políticas SEGURAS que verificam através do insight relacionado
CREATE POLICY "Users can only view recommendations from their own insights"
ON public.ai_recommendations
FOR SELECT
TO authenticated
USING (
  insight_id IN (
    SELECT id 
    FROM public.ai_insights 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can only insert recommendations for their own insights"
ON public.ai_recommendations
FOR INSERT
TO authenticated
WITH CHECK (
  insight_id IN (
    SELECT id 
    FROM public.ai_insights 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can only update recommendations from their own insights"
ON public.ai_recommendations
FOR UPDATE
TO authenticated
USING (
  insight_id IN (
    SELECT id 
    FROM public.ai_insights 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can only delete recommendations from their own insights"
ON public.ai_recommendations
FOR DELETE
TO authenticated
USING (
  insight_id IN (
    SELECT id 
    FROM public.ai_insights 
    WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 3. COMENTÁRIOS DE SEGURANÇA
-- =====================================================

COMMENT ON POLICY "Users can only view their own insights in their company" ON public.ai_insights IS 
'SECURITY: Garante que usuários só vejam seus próprios insights. Verifica auth.uid() = user_id E company_id.';

COMMENT ON POLICY "Users can only view recommendations from their own insights" ON public.ai_recommendations IS 
'SECURITY: Garante que usuários só vejam recomendações de seus próprios insights através do insight_id.';

-- =====================================================
-- PADRÃO DE SEGURANÇA PARA FUTURAS TABELAS:
-- =====================================================
-- 1. SEMPRE verificar auth.uid() = user_id para dados do usuário
-- 2. SEMPRE verificar company_id quando relevante
-- 3. NUNCA confiar apenas em company_id (usuário pode estar em múltiplas empresas)
-- 4. Para tabelas relacionadas, verificar através de JOINs com tabela principal
-- =====================================================