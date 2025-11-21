-- Criar relação user_company para o Bernardo com o user_id correto
INSERT INTO public.user_company_relations (
  user_id,
  company_id,
  role,
  created_at,
  updated_at
)
VALUES (
  'e0509600-0fad-47ef-a964-3a50cffdbf3a',
  '60307b2c-a6f1-4e1e-8ae3-18f1108d9254',
  'admin',
  now(),
  now()
)
ON CONFLICT (user_id, company_id) 
DO UPDATE SET
  role = 'admin',
  updated_at = now();

-- Atualizar também o role no profiles usando o user_id correto
UPDATE profiles
SET role = 'admin',
    updated_at = now()
WHERE user_id = 'e0509600-0fad-47ef-a964-3a50cffdbf3a';