-- Fase 1: Remover roles duplicadas, mantendo apenas a mais alta na hierarquia
-- Para cada user_id + module_id, mantém apenas a role com maior prioridade (admin > manager > member)
WITH ranked_roles AS (
  SELECT 
    id,
    user_id,
    module_id,
    role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, module_id 
      ORDER BY 
        CASE role 
          WHEN 'admin' THEN 1 
          WHEN 'manager' THEN 2 
          WHEN 'member' THEN 3 
        END
    ) as rn
  FROM user_module_roles
)
DELETE FROM user_module_roles 
WHERE id IN (
  SELECT id FROM ranked_roles WHERE rn > 1
);

-- Fase 2: Adicionar constraint UNIQUE para prevenir futuras duplicatas
ALTER TABLE user_module_roles 
ADD CONSTRAINT unique_user_module_role 
UNIQUE (user_id, module_id);

-- Fase 3: Atualizar função set_user_module_roles para usar UPSERT
CREATE OR REPLACE FUNCTION set_user_module_roles(
  _user_id uuid,
  _module_id uuid,
  _role app_role,
  _active boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- UPSERT: insere ou atualiza se já existir
  INSERT INTO user_module_roles (user_id, module_id, role, active)
  VALUES (_user_id, _module_id, _role, _active)
  ON CONFLICT (user_id, module_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    active = EXCLUDED.active,
    updated_at = now();
END;
$$;