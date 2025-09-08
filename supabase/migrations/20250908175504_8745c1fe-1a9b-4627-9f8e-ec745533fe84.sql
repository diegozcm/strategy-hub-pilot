-- Create RLS policy to allow startups to create action items for their sessions
CREATE POLICY "Startups can create action items for their sessions" 
ON action_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM mentoring_sessions ms
    JOIN user_company_relations ucr ON ucr.company_id = ms.startup_company_id
    WHERE ms.id = action_items.session_id 
    AND ucr.user_id = auth.uid()
  )
);