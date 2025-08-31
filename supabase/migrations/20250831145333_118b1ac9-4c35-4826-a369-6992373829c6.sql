-- Corrigir policy RLS da tabela companies para eliminar ambiguidade de company_id
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;

-- Recriar policy com referências totalmente qualificadas
CREATE POLICY "Users can view companies" ON public.companies
FOR SELECT USING (
  (auth.uid() IS NOT NULL) 
  AND (
    (companies.company_type = 'regular'::company_type) 
    OR (
      (companies.company_type = 'startup'::company_type) 
      AND EXISTS (
        SELECT 1
        FROM public.user_company_relations ucr
        WHERE ucr.company_id = companies.id 
          AND ucr.user_id = auth.uid()
      )
    )
  )
);