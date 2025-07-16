-- Corrigir arquitetura de exclusão: dados pertencem à empresa, não ao usuário

-- 1. Primeiro, vamos ajustar as foreign keys para garantir que dados permaneçam quando usuário é excluído
-- mas sejam removidos quando empresa é excluída

-- Alterar tabela strategic_plans para CASCADE na empresa
ALTER TABLE public.strategic_plans 
DROP CONSTRAINT IF EXISTS strategic_plans_company_id_fkey,
ADD CONSTRAINT strategic_plans_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Alterar tabela strategic_pillars para CASCADE na empresa  
ALTER TABLE public.strategic_pillars 
DROP CONSTRAINT IF EXISTS strategic_pillars_company_id_fkey,
ADD CONSTRAINT strategic_pillars_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Alterar tabela strategic_projects para CASCADE na empresa
ALTER TABLE public.strategic_projects 
DROP CONSTRAINT IF EXISTS strategic_projects_company_id_fkey,
ADD CONSTRAINT strategic_projects_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Alterar tabela profiles para SET NULL quando usuário é excluído (preservar dados)
-- mas CASCADE quando empresa é excluída
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_company_id_fkey,
ADD CONSTRAINT profiles_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Para user_company_relations, CASCADE em ambos os casos
ALTER TABLE public.user_company_relations 
DROP CONSTRAINT IF EXISTS user_company_relations_company_id_fkey,
ADD CONSTRAINT user_company_relations_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Criar função para exclusão segura de usuários (preservando dados da empresa)
CREATE OR REPLACE FUNCTION public.safe_delete_user(_user_id UUID, _admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  -- Não permitir que admin exclua a si mesmo
  IF _user_id = _admin_id THEN
    RAISE EXCEPTION 'Administradores não podem excluir a si mesmos';
  END IF;

  -- Remover apenas as relações do usuário, preservando os dados da empresa
  DELETE FROM public.user_company_relations WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE user_id = _user_id;
  
  -- Remover do auth.users (isso não afetará dados da empresa)
  DELETE FROM auth.users WHERE id = _user_id;

  RETURN TRUE;
END;
$$;

-- Função para verificar se empresa pode ser excluída (verificar dependências)
CREATE OR REPLACE FUNCTION public.can_delete_company(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Contar usuários ativos associados à empresa
  SELECT COUNT(*) INTO user_count
  FROM public.user_company_relations ucr
  JOIN public.profiles p ON p.user_id = ucr.user_id
  WHERE ucr.company_id = _company_id 
    AND p.status = 'active';

  -- Permitir exclusão apenas se não houver usuários ativos
  RETURN user_count = 0;
END;
$$;