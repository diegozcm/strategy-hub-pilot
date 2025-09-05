-- Fix ambiguous column references in RLS policies

-- Drop and recreate the problematic policy with proper qualifications
DROP POLICY IF EXISTS "Startups can view their assigned mentors profiles" ON startup_hub_profiles;

CREATE POLICY "Startups can view their assigned mentors profiles" 
ON startup_hub_profiles 
FOR SELECT 
USING (
  (startup_hub_profiles.type = 'mentor'::startup_hub_profile_type) 
  AND (startup_hub_profiles.status = 'active'::text) 
  AND EXISTS (
    SELECT 1 
    FROM mentor_startup_relations msr
    JOIN user_company_relations ucr ON ucr.company_id = msr.startup_company_id
    WHERE msr.mentor_id = startup_hub_profiles.user_id 
      AND ucr.user_id = auth.uid()
      AND msr.status = 'active'::text
  )
);

-- Also check and fix any other potentially ambiguous policies
-- Fix the user_company_relations policy if it has similar issues
DROP POLICY IF EXISTS "Users can view their company members" ON startup_hub_profiles;

CREATE POLICY "Users can view their company members" 
ON startup_hub_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM user_company_relations ucr1
    JOIN user_company_relations ucr2 ON ucr1.company_id = ucr2.company_id
    WHERE ucr1.user_id = auth.uid() 
      AND ucr2.user_id = startup_hub_profiles.user_id
  )
);