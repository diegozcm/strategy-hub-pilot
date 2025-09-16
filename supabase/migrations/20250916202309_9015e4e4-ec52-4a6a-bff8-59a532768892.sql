-- Fix RLS policies for kr_initiatives table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view company KR initiatives" ON kr_initiatives;
DROP POLICY IF EXISTS "Users can create company KR initiatives" ON kr_initiatives;
DROP POLICY IF EXISTS "Users can update company KR initiatives" ON kr_initiatives;
DROP POLICY IF EXISTS "Users can delete company KR initiatives" ON kr_initiatives;

-- Create proper RLS policies for kr_initiatives
CREATE POLICY "Users can view company KR initiatives" 
ON kr_initiatives FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM (
      user_company_relations ucr
      JOIN strategic_plans sp ON (sp.id = (
        SELECT so.plan_id FROM strategic_objectives so 
        WHERE so.id = (
          SELECT kr.objective_id FROM key_results kr 
          WHERE kr.id = kr_initiatives.key_result_id
        )
      ))
    )
    WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can create company KR initiatives" 
ON kr_initiatives FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM (
      user_company_relations ucr
      JOIN strategic_plans sp ON (sp.id = (
        SELECT so.plan_id FROM strategic_objectives so 
        WHERE so.id = (
          SELECT kr.objective_id FROM key_results kr 
          WHERE kr.id = kr_initiatives.key_result_id
        )
      ))
    )
    WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
  ) AND created_by = auth.uid()
);

CREATE POLICY "Users can update company KR initiatives" 
ON kr_initiatives FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM (
      user_company_relations ucr
      JOIN strategic_plans sp ON (sp.id = (
        SELECT so.plan_id FROM strategic_objectives so 
        WHERE so.id = (
          SELECT kr.objective_id FROM key_results kr 
          WHERE kr.id = kr_initiatives.key_result_id
        )
      ))
    )
    WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM (
      user_company_relations ucr
      JOIN strategic_plans sp ON (sp.id = (
        SELECT so.plan_id FROM strategic_objectives so 
        WHERE so.id = (
          SELECT kr.objective_id FROM key_results kr 
          WHERE kr.id = kr_initiatives.key_result_id
        )
      ))
    )
    WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can delete company KR initiatives" 
ON kr_initiatives FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM (
      user_company_relations ucr
      JOIN strategic_plans sp ON (sp.id = (
        SELECT so.plan_id FROM strategic_objectives so 
        WHERE so.id = (
          SELECT kr.objective_id FROM key_results kr 
          WHERE kr.id = kr_initiatives.key_result_id
        )
      ))
    )
    WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
  )
);