-- Habilitar RLS na tabela project_objective_relations
ALTER TABLE public.project_objective_relations ENABLE ROW LEVEL SECURITY;

-- Usuários podem visualizar relações de projetos da sua empresa
CREATE POLICY "Users can view project objectives for company projects"
ON public.project_objective_relations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_projects sp ON sp.id = project_objective_relations.project_id
    WHERE ucr.user_id = auth.uid()
    AND ucr.company_id = sp.company_id
  )
);

-- Usuários podem criar relações para projetos da sua empresa
CREATE POLICY "Users can create project objectives for company projects"
ON public.project_objective_relations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_projects sp ON sp.id = project_objective_relations.project_id
    WHERE ucr.user_id = auth.uid()
    AND ucr.company_id = sp.company_id
  )
);

-- Usuários podem deletar relações de projetos da sua empresa
CREATE POLICY "Users can delete project objectives for company projects"
ON public.project_objective_relations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    JOIN strategic_projects sp ON sp.id = project_objective_relations.project_id
    WHERE ucr.user_id = auth.uid()
    AND ucr.company_id = sp.company_id
  )
);