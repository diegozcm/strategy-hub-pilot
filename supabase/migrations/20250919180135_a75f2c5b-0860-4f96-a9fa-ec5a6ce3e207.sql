-- Create RLS policies for mentoring_sessions table
ALTER TABLE mentoring_sessions ENABLE ROW LEVEL SECURITY;

-- Allow startup users to view sessions for their company
CREATE POLICY "Startup users can view their company sessions"
ON mentoring_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = mentoring_sessions.startup_company_id
  )
);

-- Allow mentors to view sessions they created
CREATE POLICY "Mentors can view their sessions"
ON mentoring_sessions
FOR SELECT
USING (mentor_id = auth.uid());

-- Allow mentors to create sessions
CREATE POLICY "Mentors can create sessions"
ON mentoring_sessions
FOR INSERT
WITH CHECK (mentor_id = auth.uid());

-- Allow mentors to update their sessions
CREATE POLICY "Mentors can update their sessions"
ON mentoring_sessions
FOR UPDATE
USING (mentor_id = auth.uid());

-- Allow mentors to delete their sessions
CREATE POLICY "Mentors can delete their sessions"
ON mentoring_sessions
FOR DELETE
USING (mentor_id = auth.uid());