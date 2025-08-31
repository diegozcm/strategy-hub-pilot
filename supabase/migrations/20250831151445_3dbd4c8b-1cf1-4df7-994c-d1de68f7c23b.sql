-- Corrigir ambiguidade na função has_role e política RLS de user_company_relations

-- 1. Corrigir a função has_role com referências totalmente qualificadas
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    LEFT JOIN public.companies c ON p.company_id = c.id
    WHERE p.user_id = _user_id
      AND p.role = _role
      AND p.status = 'active'
      AND (c.status IS NULL OR c.status = 'active')
  );
$function$;

-- 2. Simplificar as políticas RLS de user_company_relations para evitar ambiguidade durante INSERT
DROP POLICY IF EXISTS "Admins can manage company relations" ON public.user_company_relations;
DROP POLICY IF EXISTS "Users can view company relations" ON public.user_company_relations;

-- 3. Criar políticas mais específicas
CREATE POLICY "Users can insert company relations" ON public.user_company_relations
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles pr 
    WHERE pr.user_id = auth.uid() AND pr.role = 'admin'::app_role AND pr.status = 'active'
  )
);

CREATE POLICY "Users can update company relations" ON public.user_company_relations
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles pr 
    WHERE pr.user_id = auth.uid() AND pr.role = 'admin'::app_role AND pr.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles pr 
    WHERE pr.user_id = auth.uid() AND pr.role = 'admin'::app_role AND pr.status = 'active'
  )
);

CREATE POLICY "Users can delete company relations" ON public.user_company_relations
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles pr 
    WHERE pr.user_id = auth.uid() AND pr.role = 'admin'::app_role AND pr.status = 'active'
  )
);

CREATE POLICY "Users can view company relations" ON public.user_company_relations
FOR SELECT 
USING (auth.uid() IS NOT NULL);