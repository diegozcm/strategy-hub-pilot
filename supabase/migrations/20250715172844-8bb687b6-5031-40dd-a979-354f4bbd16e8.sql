-- Adicionar campo status na tabela companies se não existir
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

-- Adicionar campo company_id na tabela profiles se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Criar índice para melhor performance nas queries de usuários por empresa
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Atualizar função has_role para verificar se a empresa está ativa
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    LEFT JOIN public.companies c ON p.company_id = c.id
    WHERE p.user_id = _user_id
      AND p.role = _role
      AND p.status = 'active'
      AND (c.status IS NULL OR c.status = 'active')
  );
$$;