
-- Adicionar coluna approved_by e approved_at na tabela profiles para rastreamento
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Atualizar a função has_role para ser mais robusta
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.role = _role
      AND p.status = 'active'
  ) OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  )
$$;

-- Criar função para atualizar role do usuário
CREATE OR REPLACE FUNCTION public.update_user_role(_user_id UUID, _new_role app_role, _admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar roles de usuários';
  END IF;

  -- Atualizar o role na tabela profiles
  UPDATE public.profiles 
  SET 
    role = _new_role,
    updated_at = now(),
    approved_by = _admin_id,
    approved_at = now()
  WHERE user_id = _user_id;

  -- Atualizar ou inserir na tabela user_roles
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (_user_id, _new_role, now(), now())
  ON CONFLICT (user_id, role) DO UPDATE SET
    updated_at = now();

  -- Remover roles antigos se necessário
  DELETE FROM public.user_roles 
  WHERE user_id = _user_id AND role != _new_role;

  RETURN TRUE;
END;
$$;

-- Criar função para desativar usuário
CREATE OR REPLACE FUNCTION public.deactivate_user(_user_id UUID, _admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem desativar usuários';
  END IF;

  -- Não permitir que admin desative a si mesmo
  IF _user_id = _admin_id THEN
    RAISE EXCEPTION 'Administradores não podem desativar a si mesmos';
  END IF;

  -- Atualizar status na tabela profiles
  UPDATE public.profiles 
  SET 
    status = 'inactive',
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$$;

-- Criar função para reativar usuário
CREATE OR REPLACE FUNCTION public.activate_user(_user_id UUID, _admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem reativar usuários';
  END IF;

  -- Atualizar status na tabela profiles
  UPDATE public.profiles 
  SET 
    status = 'active',
    updated_at = now(),
    approved_by = _admin_id,
    approved_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$$;
