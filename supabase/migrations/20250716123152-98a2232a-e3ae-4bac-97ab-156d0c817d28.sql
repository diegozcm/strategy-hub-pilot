-- Corrigir política RLS para permitir que admins excluam empresas

-- Remover política existente
DROP POLICY "Users can delete companies" ON public.companies;

-- Criar nova política que permite owner ou admin excluir
CREATE POLICY "Users can delete companies" 
ON public.companies 
FOR DELETE 
USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'));