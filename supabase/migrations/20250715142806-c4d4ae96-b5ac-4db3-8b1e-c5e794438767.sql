-- Inserir usuários de exemplo com diferentes perfis de acesso

-- 1. Usuário Admin
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Admin", "last_name": "Sistema"}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Perfil do Admin
INSERT INTO public.profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  role,
  status,
  position,
  department,
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
  'Administrador do Sistema',
  'TI',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  first_name = 'Admin',
  last_name = 'Sistema',
  email = 'admin@example.com';

-- Role do Admin
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'admin', now(), now())
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Usuário Manager
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'manager@example.com',
  crypt('manager123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Gestor", "last_name": "Operacional"}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Perfil do Manager
INSERT INTO public.profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  role,
  status,
  position,
  department,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  'Gestor',
  'Operacional',
  'manager@example.com',
  'manager',
  'active',
  'Gerente de Operações',
  'Operações',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'manager',
  status = 'active',
  first_name = 'Gestor',
  last_name = 'Operacional',
  email = 'manager@example.com';

-- Role do Manager
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222222', 'manager', now(), now())
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Usuário Member
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'member@example.com',
  crypt('member123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Colaborador", "last_name": "Exemplo"}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Perfil do Member
INSERT INTO public.profiles (
  id,
  user_id,
  first_name,
  last_name,
  email,
  role,
  status,
  position,
  department,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '33333333-3333-3333-3333-333333333333',
  'Colaborador',
  'Exemplo',
  'member@example.com',
  'member',
  'active',
  'Analista',
  'Vendas',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'member',
  status = 'active',
  first_name = 'Colaborador',
  last_name = 'Exemplo',
  email = 'member@example.com';

-- Role do Member
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
VALUES ('33333333-3333-3333-3333-333333333333', 'member', now(), now())
ON CONFLICT (user_id, role) DO NOTHING;