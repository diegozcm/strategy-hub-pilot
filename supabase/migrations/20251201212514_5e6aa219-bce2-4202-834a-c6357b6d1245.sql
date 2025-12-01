-- Adicionar política RLS de leitura para todos os usuários da empresa
-- Isso permite que membros leiam as configurações do módulo (como members_can_view_all)
-- Mas apenas managers/admins podem modificar as configurações

CREATE POLICY "Company members can read module settings"
ON public.company_module_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_company_relations ucr
    WHERE ucr.company_id = company_module_settings.company_id
      AND ucr.user_id = auth.uid()
  )
);