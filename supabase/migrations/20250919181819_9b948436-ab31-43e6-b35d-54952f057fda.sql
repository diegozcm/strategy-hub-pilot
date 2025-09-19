-- Allow startup users to view mentor profiles from their mentoring sessions
CREATE POLICY "Startup users can view mentor profiles from sessions"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mentoring_sessions ms
    JOIN user_company_relations ucr ON ucr.company_id = ms.startup_company_id
    WHERE ms.mentor_id = profiles.user_id 
    AND ucr.user_id = auth.uid()
  )
);