-- Garantir que a relação entre profiles e companies está correta
-- Se a coluna company_id já existe, apenas adicionar constraint se não existir
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_company_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        -- Adicionar foreign key constraint se não existir
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Criar função para vincular usuário a empresa
CREATE OR REPLACE FUNCTION public.assign_user_to_company(_user_id UUID, _company_id UUID, _admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular usuários a empresas';
  END IF;

  -- Atualizar company_id do usuário
  UPDATE public.profiles 
  SET 
    company_id = _company_id,
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$$;

-- Criar função para desvincular usuário de empresa
CREATE OR REPLACE FUNCTION public.unassign_user_from_company(_user_id UUID, _admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem desvincular usuários de empresas';
  END IF;

  -- Remover company_id do usuário
  UPDATE public.profiles 
  SET 
    company_id = NULL,
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$$;