-- Atualizar políticas RLS para empresas conforme novas regras de permissão

-- Remover política atual de criação
DROP POLICY "Users can create companies" ON public.companies;

-- Remover política atual de atualização  
DROP POLICY "Users can update companies" ON public.companies;

-- Criar nova política: apenas admins podem criar empresas
CREATE POLICY "Only admins can create companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Criar nova política: admins podem atualizar tudo, gestores apenas dados principais (não nome)
CREATE POLICY "Company update permissions" 
ON public.companies 
FOR UPDATE 
USING (
  -- Admin pode atualizar tudo
  has_role(auth.uid(), 'admin') OR 
  -- Owner pode atualizar tudo
  auth.uid() = owner_id OR
  -- Manager pode atualizar apenas dados específicos (será controlado no frontend)
  has_role(auth.uid(), 'manager')
);

-- Manter política de visualização inalterada
-- "Users can view companies" já existe e está adequada

-- Política de DELETE já foi atualizada anteriormente para permitir admin + owner