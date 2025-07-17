-- Primeiro, vamos associar objetivos existentes sem pilar a um pilar padrão
-- Criamos um pilar padrão para cada empresa que tenha objetivos sem pilar
INSERT INTO strategic_pillars (company_id, name, description, color, order_index)
SELECT DISTINCT 
  sp.company_id,
  'Pilar Padrão' as name,
  'Pilar criado automaticamente para objetivos existentes' as description,
  '#3B82F6' as color,
  999 as order_index
FROM strategic_plans sp
WHERE sp.company_id NOT IN (
  SELECT DISTINCT company_id 
  FROM strategic_pillars 
  WHERE name = 'Pilar Padrão'
)
AND EXISTS (
  SELECT 1 
  FROM strategic_objectives so 
  WHERE so.plan_id = sp.id 
  AND so.pillar_id IS NULL
);

-- Agora associamos todos os objetivos sem pilar ao pilar padrão de sua empresa
UPDATE strategic_objectives 
SET pillar_id = (
  SELECT sp_pillar.id
  FROM strategic_pillars sp_pillar
  JOIN strategic_plans sp_plan ON sp_pillar.company_id = sp_plan.company_id
  WHERE sp_plan.id = strategic_objectives.plan_id
  AND sp_pillar.name = 'Pilar Padrão'
  LIMIT 1
)
WHERE pillar_id IS NULL;

-- Finalmente, tornamos o pillar_id obrigatório
ALTER TABLE strategic_objectives 
ALTER COLUMN pillar_id SET NOT NULL;