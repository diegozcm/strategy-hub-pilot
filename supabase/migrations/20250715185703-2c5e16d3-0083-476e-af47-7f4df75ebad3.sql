-- Criar tabela para relacionamento many-to-many entre usuários e empresas
CREATE TABLE IF NOT EXISTS public.user_company_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  role VARCHAR DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign keys
  CONSTRAINT user_company_relations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_company_relations_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
    
  -- Evitar duplicatas
  UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.user_company_relations ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view company relations" 
ON public.user_company_relations 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage company relations" 
ON public.user_company_relations 
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_user_company_relations_updated_at
  BEFORE UPDATE ON public.user_company_relations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função para vincular usuário a empresa (many-to-many)
CREATE OR REPLACE FUNCTION public.assign_user_to_company_v2(_user_id UUID, _company_id UUID, _admin_id UUID, _role VARCHAR DEFAULT 'member')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular usuários a empresas';
  END IF;

  -- Inserir ou atualizar a relação
  INSERT INTO public.user_company_relations (user_id, company_id, role, created_at, updated_at)
  VALUES (_user_id, _company_id, _role, now(), now())
  ON CONFLICT (user_id, company_id) DO UPDATE SET
    role = _role,
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- Criar função para desvincular usuário de empresa
CREATE OR REPLACE FUNCTION public.unassign_user_from_company_v2(_user_id UUID, _company_id UUID, _admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem desvincular usuários de empresas';
  END IF;

  -- Remover a relação específica
  DELETE FROM public.user_company_relations
  WHERE user_id = _user_id AND company_id = _company_id;

  RETURN TRUE;
END;
$$;