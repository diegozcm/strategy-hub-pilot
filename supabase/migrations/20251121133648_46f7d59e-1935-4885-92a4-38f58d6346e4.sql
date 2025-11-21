-- 1. Habilitar OKR para a Empresa Modelo
UPDATE companies
SET okr_enabled = true,
    updated_at = now()
WHERE id = '60307b2c-a6f1-4e1e-8ae3-18f1108d9254';

-- 2. Atualizar role do Bernardo para admin em user_company_relations
UPDATE user_company_relations
SET role = 'admin'
WHERE user_id = '3b95c9bf-a743-4bec-89f7-d6e2ed5887ed'
  AND company_id = '60307b2c-a6f1-4e1e-8ae3-18f1108d9254';

-- 3. Atualizar role do Bernardo na tabela profiles também
UPDATE profiles
SET role = 'admin',
    updated_at = now()
WHERE id = '3b95c9bf-a743-4bec-89f7-d6e2ed5887ed';