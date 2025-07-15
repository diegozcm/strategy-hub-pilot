-- Atualizar a senha do usuário admin para garantir que está correta
UPDATE auth.users 
SET 
  encrypted_password = crypt('admin123', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now()
WHERE email = 'admin@example.com';

-- Garantir que o perfil está correto
UPDATE public.profiles 
SET 
  role = 'admin',
  status = 'active',
  first_name = 'Admin',
  last_name = 'Sistema',
  email = 'admin@example.com'
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Garantir que as permissões estão corretas
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'admin', now(), now())
ON CONFLICT (user_id, role) DO UPDATE SET
  role = 'admin',
  updated_at = now();