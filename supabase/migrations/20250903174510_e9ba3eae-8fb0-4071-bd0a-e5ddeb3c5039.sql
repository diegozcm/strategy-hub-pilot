-- Create policy to allow startups to view their assigned mentors' profiles
CREATE POLICY "Startups can view their assigned mentors profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM mentor_startup_relations msr
    JOIN user_company_relations ucr ON ucr.company_id = msr.startup_company_id
    WHERE msr.mentor_id = profiles.user_id
    AND ucr.user_id = auth.uid()
    AND msr.status = 'active'
  )
);