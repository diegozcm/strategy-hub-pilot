-- Criar perfil para o usuário admin hardcoded se não existir
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
  au.id,
  'Admin',
  'Sistema',
  au.email,
  'admin'::app_role,
  'active',
  now(),
  now()
FROM auth.users au
WHERE au.email = 'admin@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = au.id
  );

-- Garantir que o usuário admin também tenha entrada na tabela user_roles
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT 
  au.id,
  'admin'::app_role,
  now(),
  now()
FROM auth.users au
WHERE au.email = 'admin@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = au.id AND ur.role = 'admin'::app_role
  );