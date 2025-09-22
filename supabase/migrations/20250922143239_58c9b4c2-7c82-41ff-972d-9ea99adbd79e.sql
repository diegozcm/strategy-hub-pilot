-- Fix RLS policies for vision_alignment and vision_alignment_objectives to support both patterns
-- Also add debugging and make policies more robust

-- First, drop existing policies for vision_alignment
DROP POLICY IF EXISTS "Users can view company vision alignment" ON vision_alignment;
DROP POLICY IF EXISTS "Users can create company vision alignment" ON vision_alignment;
DROP POLICY IF EXISTS "Users can update company vision alignment" ON vision_alignment;
DROP POLICY IF EXISTS "Users can delete company vision alignment" ON vision_alignment;

-- Create new compatible policies for vision_alignment
CREATE POLICY "Users can view vision alignment"
ON vision_alignment FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Option 1: User belongs to company via profiles.company_id
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.company_id = vision_alignment.company_id
    )
    OR
    -- Option 2: User belongs to company via user_company_relations
    EXISTS (
      SELECT 1 FROM user_company_relations ucr 
      WHERE ucr.user_id = auth.uid() 
      AND ucr.company_id = vision_alignment.company_id
    )
  )
);

CREATE POLICY "Users can create vision alignment"
ON vision_alignment FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = created_by
  AND (
    -- Option 1: User belongs to company via profiles.company_id
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.company_id = vision_alignment.company_id
    )
    OR
    -- Option 2: User belongs to company via user_company_relations
    EXISTS (
      SELECT 1 FROM user_company_relations ucr 
      WHERE ucr.user_id = auth.uid() 
      AND ucr.company_id = vision_alignment.company_id
    )
  )
);

CREATE POLICY "Users can update vision alignment"
ON vision_alignment FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Option 1: User belongs to company via profiles.company_id
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.company_id = vision_alignment.company_id
    )
    OR
    -- Option 2: User belongs to company via user_company_relations
    EXISTS (
      SELECT 1 FROM user_company_relations ucr 
      WHERE ucr.user_id = auth.uid() 
      AND ucr.company_id = vision_alignment.company_id
    )
  )
);

CREATE POLICY "Users can delete vision alignment"
ON vision_alignment FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Option 1: User belongs to company via profiles.company_id
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.company_id = vision_alignment.company_id
    )
    OR
    -- Option 2: User belongs to company via user_company_relations
    EXISTS (
      SELECT 1 FROM user_company_relations ucr 
      WHERE ucr.user_id = auth.uid() 
      AND ucr.company_id = vision_alignment.company_id
    )
  )
);

-- Now fix the policies for vision_alignment_objectives
DROP POLICY IF EXISTS "Users can view company vision alignment objectives" ON vision_alignment_objectives;
DROP POLICY IF EXISTS "Users can create company vision alignment objectives" ON vision_alignment_objectives;
DROP POLICY IF EXISTS "Users can update company vision alignment objectives" ON vision_alignment_objectives;
DROP POLICY IF EXISTS "Users can delete company vision alignment objectives" ON vision_alignment_objectives;

CREATE POLICY "Users can view vision alignment objectives"
ON vision_alignment_objectives FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM vision_alignment va 
    WHERE va.id = vision_alignment_objectives.vision_alignment_id
    AND (
      -- Option 1: User belongs to company via profiles.company_id
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.company_id = va.company_id
      )
      OR
      -- Option 2: User belongs to company via user_company_relations
      EXISTS (
        SELECT 1 FROM user_company_relations ucr 
        WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = va.company_id
      )
    )
  )
);

CREATE POLICY "Users can create vision alignment objectives"
ON vision_alignment_objectives FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM vision_alignment va 
    WHERE va.id = vision_alignment_objectives.vision_alignment_id
    AND (
      -- Option 1: User belongs to company via profiles.company_id
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.company_id = va.company_id
      )
      OR
      -- Option 2: User belongs to company via user_company_relations
      EXISTS (
        SELECT 1 FROM user_company_relations ucr 
        WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = va.company_id
      )
    )
  )
);

CREATE POLICY "Users can update vision alignment objectives"
ON vision_alignment_objectives FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM vision_alignment va 
    WHERE va.id = vision_alignment_objectives.vision_alignment_id
    AND (
      -- Option 1: User belongs to company via profiles.company_id
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.company_id = va.company_id
      )
      OR
      -- Option 2: User belongs to company via user_company_relations
      EXISTS (
        SELECT 1 FROM user_company_relations ucr 
        WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = va.company_id
      )
    )
  )
);

CREATE POLICY "Users can delete vision alignment objectives"
ON vision_alignment_objectives FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM vision_alignment va 
    WHERE va.id = vision_alignment_objectives.vision_alignment_id
    AND (
      -- Option 1: User belongs to company via profiles.company_id
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.company_id = va.company_id
      )
      OR
      -- Option 2: User belongs to company via user_company_relations
      EXISTS (
        SELECT 1 FROM user_company_relations ucr 
        WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = va.company_id
      )
    )
  )
);

-- Create a debug function to help identify auth issues
CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS TABLE(
  current_user_id uuid,
  session_exists boolean,
  profile_exists boolean,
  profile_company_id uuid,
  user_company_relations_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    (auth.uid() IS NOT NULL) as session_exists,
    EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid()) as profile_exists,
    (SELECT company_id FROM profiles WHERE user_id = auth.uid()) as profile_company_id,
    (SELECT COUNT(*) FROM user_company_relations WHERE user_id = auth.uid()) as user_company_relations_count;
END;
$$;