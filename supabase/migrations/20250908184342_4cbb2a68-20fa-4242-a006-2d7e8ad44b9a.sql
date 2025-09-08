-- Drop all existing RLS policies on strategic_objectives
DROP POLICY IF EXISTS "Users can create company strategic objectives" ON strategic_objectives;
DROP POLICY IF EXISTS "Users can create strategic objectives" ON strategic_objectives;
DROP POLICY IF EXISTS "Users can delete company strategic objectives" ON strategic_objectives;
DROP POLICY IF EXISTS "Users can delete strategic objectives" ON strategic_objectives;
DROP POLICY IF EXISTS "Users can update company strategic objectives" ON strategic_objectives;
DROP POLICY IF EXISTS "Users can update strategic objectives" ON strategic_objectives;
DROP POLICY IF EXISTS "Users can view company strategic objectives" ON strategic_objectives;

-- Create consistent RLS policies for strategic_objectives
CREATE POLICY "Users can view their company strategic objectives" 
ON strategic_objectives 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_plans sp ON sp.id = strategic_objectives.plan_id
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can create strategic objectives for their company" 
ON strategic_objectives 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_plans sp ON sp.id = strategic_objectives.plan_id
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can update their company strategic objectives" 
ON strategic_objectives 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_plans sp ON sp.id = strategic_objectives.plan_id
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can delete their company strategic objectives" 
ON strategic_objectives 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_plans sp ON sp.id = strategic_objectives.plan_id
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

-- Ensure RLS is enabled
ALTER TABLE strategic_objectives ENABLE ROW LEVEL SECURITY;