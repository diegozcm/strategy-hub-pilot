-- Sincronizar todas as roles do módulo Strategy HUB para 'manager'
-- Módulo Strategy HUB ID: cc86887a-1f7c-40b6-807b-22a2e304293b

-- 1. Atualizar registros existentes para active=true e role='manager'
UPDATE user_module_roles 
SET active = true, role = 'manager', updated_at = now()
WHERE module_id = 'cc86887a-1f7c-40b6-807b-22a2e304293b'
AND user_id IN (
  SELECT user_id FROM user_modules 
  WHERE module_id = 'cc86887a-1f7c-40b6-807b-22a2e304293b' 
  AND active = true
);

-- 2. Inserir registros para usuários que não têm em user_module_roles
INSERT INTO user_module_roles (user_id, module_id, role, active, created_at, updated_at)
SELECT 
  um.user_id,
  um.module_id,
  'manager'::app_role,
  true,
  now(),
  now()
FROM user_modules um
WHERE um.module_id = 'cc86887a-1f7c-40b6-807b-22a2e304293b'
AND um.active = true
AND NOT EXISTS (
  SELECT 1 FROM user_module_roles umr 
  WHERE umr.user_id = um.user_id 
  AND umr.module_id = um.module_id
)
ON CONFLICT (user_id, module_id) DO UPDATE SET
  active = true,
  role = 'manager',
  updated_at = now();