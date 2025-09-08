-- Create RLS policy to allow startups to update action item status
CREATE POLICY "Startups can update status of their action items" 
ON action_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM mentoring_sessions ms
    JOIN user_company_relations ucr ON ucr.company_id = ms.startup_company_id
    WHERE ms.id = action_items.session_id 
    AND ucr.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM mentoring_sessions ms
    JOIN user_company_relations ucr ON ucr.company_id = ms.startup_company_id
    WHERE ms.id = action_items.session_id 
    AND ucr.user_id = auth.uid()
  )
);