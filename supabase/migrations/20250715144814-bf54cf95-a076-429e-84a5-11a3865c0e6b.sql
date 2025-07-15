-- Deletar o usuário admin existente e recriar com senha correta
DELETE FROM auth.users WHERE email = 'admin@example.com';
DELETE FROM public.profiles WHERE email = 'admin@example.com';
DELETE FROM public.user_roles WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Recriar o usuário admin com configuração correta
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous,
  aud,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  '$2a$10$8UznKWwISTbMC8rfpjHvg.7nDYQzgxMNaGF4h5tXFqz4aG7RGzf4K', -- admin123
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "Sistema"}',
  false,
  now(),
  now(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  false,
  'authenticated',
  'authenticated'
);

-- Recriar o perfil admin
INSERT INTO public.profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  'Admin',
  'Sistema',
  'admin@example.com',
  'admin',
  'active',
  now(),
  now()
);

-- Recriar a role admin
INSERT INTO public.user_roles (
  id,
  user_id,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  'admin',
  now(),
  now()
);