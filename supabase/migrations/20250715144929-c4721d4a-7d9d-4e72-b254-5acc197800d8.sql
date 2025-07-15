-- Verificar e deletar qualquer registro duplicado do admin
DELETE FROM public.profiles WHERE email = 'admin@example.com' OR user_id = '11111111-1111-1111-1111-111111111111';

-- Criar o perfil admin novamente
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,
  email,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Admin',
  'Sistema',
  'admin@example.com',
  'admin',
  'active',
  now(),
  now()
);

-- Verificar se o usuário na tabela auth existe e criar se não existir
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
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  '$2a$10$8UznKWwISTbMC8rfpjHvg.7nDYQzgxMNaGF4h5tXFqz4aG7RGzf4K', -- admin123
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "Sistema"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = '$2a$10$8UznKWwISTbMC8rfpjHvg.7nDYQzgxMNaGF4h5tXFqz4aG7RGzf4K',
  email_confirmed_at = now(),
  updated_at = now();

-- Criar a role admin
INSERT INTO public.user_roles (
  user_id,
  role,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin',
  now(),
  now()
) ON CONFLICT (user_id, role) DO NOTHING;