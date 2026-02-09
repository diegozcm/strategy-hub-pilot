DROP POLICY IF EXISTS "Users can view companies" ON public.companies;

CREATE POLICY "Users can view companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_system_admin(auth.uid())
    OR company_type = 'regular'
    OR (
      company_type = 'startup'
      AND EXISTS (
        SELECT 1 FROM user_company_relations ucr
        WHERE ucr.company_id = companies.id AND ucr.user_id = auth.uid()
      )
    )
  )
);