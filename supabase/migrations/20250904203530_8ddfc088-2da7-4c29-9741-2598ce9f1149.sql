-- Add DELETE policy for strategic_objectives
CREATE POLICY "Users can delete company strategic objectives" 
ON public.strategic_objectives 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM public.user_company_relations ucr
    JOIN public.strategic_plans sp ON sp.id = strategic_objectives.plan_id
    WHERE ucr.user_id = auth.uid() 
      AND ucr.company_id = sp.company_id
  )
);