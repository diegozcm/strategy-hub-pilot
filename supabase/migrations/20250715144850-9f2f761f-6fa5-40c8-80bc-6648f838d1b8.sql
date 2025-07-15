-- Deletar completamente todos os registros do admin para recriar limpo
DELETE FROM public.user_roles WHERE user_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.profiles WHERE user_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111';

-- Recriar o usuário admin do zero
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
);

-- Criar o perfil admin
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
);