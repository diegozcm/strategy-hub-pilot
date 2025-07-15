-- Verificar e limpar TUDO relacionado ao admin
DELETE FROM public.user_roles WHERE user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
DELETE FROM public.profiles WHERE user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

-- Agora apenas atualizar a senha do usuário existente se ele existir
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'admin@example.com';

-- Inserir perfil se não existir
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
  id,
  'Admin',
  'Sistema',
  'admin@example.com',
  'admin',
  'active',
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@example.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'admin@example.com'
);

-- Inserir role se não existir
INSERT INTO public.user_roles (
  user_id,
  role,
  created_at,
  updated_at
) 
SELECT 
  id,
  'admin',
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@example.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  JOIN auth.users au ON ur.user_id = au.id 
  WHERE au.email = 'admin@example.com' AND ur.role = 'admin'
);