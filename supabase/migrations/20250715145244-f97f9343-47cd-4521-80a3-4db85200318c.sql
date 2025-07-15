-- Deletar completamente o usuário admin
DELETE FROM public.user_roles WHERE user_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.profiles WHERE user_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111';

-- Criar o usuário admin com um novo ID e senha segura
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "Sistema"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Buscar o ID do usuário recém-criado e inserir o perfil
WITH new_admin AS (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
)
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,
  email,
  role,
  status,
  created_at,
  updated_at
) 
SELECT 
  new_admin.id,
  'Admin',
  'Sistema',
  'admin@example.com',
  'admin',
  'active',
  now(),
  now()
FROM new_admin;

-- Inserir a role admin
WITH new_admin AS (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
)
INSERT INTO public.user_roles (
  user_id,
  role,
  created_at,
  updated_at
) 
SELECT 
  new_admin.id,
  'admin',
  now(),
  now()
FROM new_admin;