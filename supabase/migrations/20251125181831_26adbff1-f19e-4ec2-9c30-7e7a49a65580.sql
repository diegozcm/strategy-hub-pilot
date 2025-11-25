-- Reverter política problemática e substituir por implementação segura

-- 1) Remover política RLS com recursão infinita
DROP POLICY IF EXISTS "Users can view company relations of same company members"
ON public.user_company_relations;

-- 2) Criar função SECURITY DEFINER para checar se usuário pertence à empresa
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(
  _user_id uuid,
  _company_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_company_relations
    WHERE user_id = _user_id
      AND company_id = _company_id
  );
$$;

-- 3) Criar nova política RLS usando a função (sem recursão)
CREATE POLICY "Users can view company relations of same company members"
ON public.user_company_relations
FOR SELECT
USING (
  public.user_belongs_to_company(auth.uid(), company_id)
);