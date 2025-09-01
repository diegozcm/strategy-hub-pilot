-- Criar relações mentor-startup entre mentores existentes e startups
INSERT INTO public.mentor_startup_relations (
  mentor_id, 
  startup_company_id, 
  assigned_by, 
  status
) 
SELECT 
  m.user_id as mentor_id,
  s.id as startup_company_id,
  m.user_id as assigned_by,
  'active'
FROM 
  (SELECT shp.user_id 
   FROM public.startup_hub_profiles shp 
   WHERE shp.type = 'mentor' AND shp.status = 'active'
   LIMIT 2) m
CROSS JOIN 
  (SELECT c.id 
   FROM public.companies c 
   WHERE c.company_type = 'startup' AND c.status = 'active'
   LIMIT 1) s
ON CONFLICT (mentor_id, startup_company_id) DO NOTHING;