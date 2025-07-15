-- Limpar completamente todos os registros relacionados ao admin
DELETE FROM public.user_roles ur 
WHERE ur.user_id IN (
  SELECT p.user_id FROM public.profiles p WHERE p.email = 'admin@example.com'
);

DELETE FROM public.profiles WHERE email = 'admin@example.com';
DELETE FROM auth.users WHERE email = 'admin@example.com';

-- Agora recriar o usuário admin com senha usando a função nativa do Supabase
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
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
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

-- Criar o perfil
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
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'Admin',
  'Sistema',
  'admin@example.com',
  'admin',
  'active',
  now(),
  now()
);

-- Criar a role
INSERT INTO public.user_roles (
  user_id,
  role,
  created_at,
  updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'admin',
  now(),
  now()
);