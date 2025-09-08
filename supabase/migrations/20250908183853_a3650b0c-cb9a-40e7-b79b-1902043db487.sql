-- First, drop existing policies for strategic_plans
DROP POLICY IF EXISTS "Users can create strategic plans" ON strategic_plans;
DROP POLICY IF EXISTS "Users can update strategic plans" ON strategic_plans;  
DROP POLICY IF EXISTS "Users can view company strategic plans" ON strategic_plans;
DROP POLICY IF EXISTS "Users can create company strategic plans" ON strategic_plans;
DROP POLICY IF EXISTS "Users can update company strategic plans" ON strategic_plans;

-- Create new comprehensive RLS policies for strategic_plans
-- Policy for SELECT: Users can only view plans from their company
CREATE POLICY "Users can view their company strategic plans"
ON strategic_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_plans.company_id
  )
);

-- Policy for INSERT: Users can only create plans for their company
CREATE POLICY "Users can create strategic plans for their company"
ON strategic_plans FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_plans.company_id
  )
);

-- Policy for UPDATE: Users can only update plans from their company
CREATE POLICY "Users can update their company strategic plans"
ON strategic_plans FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_plans.company_id
  )
);

-- Policy for DELETE: Users can only delete plans from their company  
CREATE POLICY "Users can delete their company strategic plans"
ON strategic_plans FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_plans.company_id
  )
);

-- Ensure RLS is enabled
ALTER TABLE strategic_plans ENABLE ROW LEVEL SECURITY;