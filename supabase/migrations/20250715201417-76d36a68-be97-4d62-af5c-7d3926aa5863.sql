-- Unificar conceito de empresa no sistema
-- Substituir organization_id por company_id em strategic_plans

-- 1. Adicionar coluna company_id na tabela strategic_plans
ALTER TABLE public.strategic_plans 
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Migrar dados existentes (copiar organization_id para company_id)
UPDATE public.strategic_plans 
SET company_id = organization_id 
WHERE organization_id IS NOT NULL;

-- 3. Remover a coluna organization_id após a migração
ALTER TABLE public.strategic_plans 
DROP COLUMN organization_id;

-- 4. Tornar company_id obrigatório
ALTER TABLE public.strategic_plans 
ALTER COLUMN company_id SET NOT NULL;

-- 5. Atualizar strategic_projects para usar company_id através do plano estratégico
-- Adicionar coluna company_id em strategic_projects
ALTER TABLE public.strategic_projects 
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 6. Migrar dados de strategic_projects para relacionar com company_id
UPDATE public.strategic_projects 
SET company_id = (
  SELECT sp.company_id 
  FROM public.strategic_plans sp 
  WHERE sp.id = strategic_projects.plan_id
) 
WHERE plan_id IS NOT NULL;

-- 7. Para projetos sem plan_id, vincular ao owner_id como company owner
UPDATE public.strategic_projects 
SET company_id = (
  SELECT c.id 
  FROM public.companies c 
  WHERE c.owner_id = strategic_projects.owner_id
  LIMIT 1
) 
WHERE company_id IS NULL;

-- 8. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_strategic_plans_company_id ON public.strategic_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_strategic_projects_company_id ON public.strategic_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_strategic_pillars_company_id ON public.strategic_pillars(company_id);

-- 9. Criar função para buscar empresa do usuário
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT c.id 
  FROM public.companies c 
  WHERE c.owner_id = _user_id
  OR EXISTS (
    SELECT 1 FROM public.user_company_relations ucr 
    WHERE ucr.user_id = _user_id AND ucr.company_id = c.id
  )
  LIMIT 1;
$$;