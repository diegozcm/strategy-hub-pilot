-- Criar tabela para sessões de impersonation
CREATE TABLE public.admin_impersonation_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS - apenas admins podem ver e gerenciar sessões de impersonation
CREATE POLICY "Admins can manage impersonation sessions"
ON public.admin_impersonation_sessions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_admin_impersonation_sessions_updated_at
  BEFORE UPDATE ON public.admin_impersonation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para iniciar impersonation (apenas admins)
CREATE OR REPLACE FUNCTION public.start_impersonation(_admin_id uuid, _target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id uuid;
BEGIN
  -- Verificar se o usuário é admin
  IF NOT public.has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem fazer impersonation';
  END IF;

  -- Não permitir que admin faça impersonation de si mesmo
  IF _admin_id = _target_user_id THEN
    RAISE EXCEPTION 'Não é possível fazer impersonation de si mesmo';
  END IF;

  -- Finalizar qualquer sessão de impersonation ativa do admin
  UPDATE public.admin_impersonation_sessions 
  SET 
    is_active = false,
    ended_at = now(),
    updated_at = now()
  WHERE admin_user_id = _admin_id AND is_active = true;

  -- Criar nova sessão de impersonation
  INSERT INTO public.admin_impersonation_sessions (
    admin_user_id,
    impersonated_user_id,
    is_active
  )
  VALUES (_admin_id, _target_user_id, true)
  RETURNING id INTO session_id;

  RETURN session_id;
END;
$$;

-- Função para finalizar impersonation
CREATE OR REPLACE FUNCTION public.end_impersonation(_admin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT public.has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem finalizar impersonation';
  END IF;

  -- Finalizar sessão ativa
  UPDATE public.admin_impersonation_sessions 
  SET 
    is_active = false,
    ended_at = now(),
    updated_at = now()
  WHERE admin_user_id = _admin_id AND is_active = true;

  RETURN true;
END;
$$;