-- Adicionar política para permitir que admins atualizem qualquer perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Política que permite usuários atualizarem seu próprio perfil OU admins atualizarem qualquer perfil
CREATE POLICY "Users can update profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Garantir que admins podem atualizar user_roles de qualquer usuário
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));