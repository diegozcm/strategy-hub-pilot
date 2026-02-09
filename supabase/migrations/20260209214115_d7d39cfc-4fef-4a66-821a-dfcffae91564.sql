-- Add RLS policy for cross-mentor visibility on shared startups
CREATE POLICY "Mentors can view sessions of shared startups"
ON public.mentoring_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM mentor_startup_relations msr1
    JOIN mentor_startup_relations msr2 ON msr1.startup_company_id = msr2.startup_company_id
    WHERE msr1.mentor_id = auth.uid()
    AND msr2.mentor_id = mentoring_sessions.mentor_id
    AND msr1.status = 'active'
    AND msr2.status = 'active'
  )
);