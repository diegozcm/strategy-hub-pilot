-- Fix RLS policies for strategic planning tables to ensure company data isolation

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view strategic plans" ON public.strategic_plans;
DROP POLICY IF EXISTS "Users can view strategic pillars" ON public.strategic_pillars;
DROP POLICY IF EXISTS "Users can view strategic objectives" ON public.strategic_objectives;
DROP POLICY IF EXISTS "Users can view key results" ON public.key_results;

-- Create company-isolated policies for strategic_plans
CREATE POLICY "Users can view company strategic plans"
ON public.strategic_plans
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_plans.company_id
  )
);

CREATE POLICY "Users can create company strategic plans"
ON public.strategic_plans
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_plans.company_id
  )
);

CREATE POLICY "Users can update company strategic plans"
ON public.strategic_plans
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_plans.company_id
  )
);

-- Create company-isolated policies for strategic_pillars
CREATE POLICY "Users can view company strategic pillars"
ON public.strategic_pillars
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_pillars.company_id
  )
);

CREATE POLICY "Users can create company strategic pillars"
ON public.strategic_pillars
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_pillars.company_id
  )
);

CREATE POLICY "Users can update company strategic pillars"
ON public.strategic_pillars
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_pillars.company_id
  )
);

CREATE POLICY "Users can delete company strategic pillars"
ON public.strategic_pillars
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_pillars.company_id
  )
);

-- Create company-isolated policies for strategic_objectives
CREATE POLICY "Users can view company strategic objectives"
ON public.strategic_objectives
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    JOIN public.strategic_plans sp ON sp.id = strategic_objectives.plan_id
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can create company strategic objectives"
ON public.strategic_objectives
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    JOIN public.strategic_plans sp ON sp.id = strategic_objectives.plan_id
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can update company strategic objectives"
ON public.strategic_objectives
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    JOIN public.strategic_plans sp ON sp.id = strategic_objectives.plan_id
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

-- Create company-isolated policies for key_results
CREATE POLICY "Users can view company key results"
ON public.key_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    JOIN public.strategic_plans sp ON sp.id = (
      SELECT so.plan_id 
      FROM public.strategic_objectives so 
      WHERE so.id = key_results.objective_id
    )
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can create company key results"
ON public.key_results
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    JOIN public.strategic_plans sp ON sp.id = (
      SELECT so.plan_id 
      FROM public.strategic_objectives so 
      WHERE so.id = key_results.objective_id
    )
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can update company key results"
ON public.key_results
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    JOIN public.strategic_plans sp ON sp.id = (
      SELECT so.plan_id 
      FROM public.strategic_objectives so 
      WHERE so.id = key_results.objective_id
    )
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

CREATE POLICY "Users can delete company key results"
ON public.key_results
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    JOIN public.strategic_plans sp ON sp.id = (
      SELECT so.plan_id 
      FROM public.strategic_objectives so 
      WHERE so.id = key_results.objective_id
    )
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = sp.company_id
  )
);

-- Create company-isolated policies for strategic_projects
DROP POLICY IF EXISTS "Users can view strategic projects" ON public.strategic_projects;
DROP POLICY IF EXISTS "Users can create strategic projects" ON public.strategic_projects;
DROP POLICY IF EXISTS "Users can update strategic projects" ON public.strategic_projects;
DROP POLICY IF EXISTS "Users can delete strategic projects" ON public.strategic_projects;

CREATE POLICY "Users can view company strategic projects"
ON public.strategic_projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_projects.company_id
  )
);

CREATE POLICY "Users can create company strategic projects"
ON public.strategic_projects
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_projects.company_id
  )
);

CREATE POLICY "Users can update company strategic projects"
ON public.strategic_projects
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_projects.company_id
  )
);

CREATE POLICY "Users can delete company strategic projects"
ON public.strategic_projects
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = strategic_projects.company_id
  )
);