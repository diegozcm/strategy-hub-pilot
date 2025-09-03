-- Corrigir owner da empresa "Chá Clube" para o usuário atual
UPDATE public.companies 
SET owner_id = '5c4ebfff-57d2-463a-8d0f-c9b127f8baaa'
WHERE id = '5f175c2e-f926-4ecd-a989-8b9620c7bec0' AND name = 'Chá Clube';

-- Criar uma relação mentor-startup para "Chá Clube" com Diego Zagonel como mentor
INSERT INTO public.mentor_startup_relations (
  mentor_id, 
  startup_company_id, 
  assigned_by, 
  status
) VALUES (
  '35749be5-8520-4d39-a98f-299af5ca5af9', -- Diego Zagonel
  '5f175c2e-f926-4ecd-a989-8b9620c7bec0', -- Chá Clube
  '35749be5-8520-4d39-a98f-299af5ca5af9', -- Assigned by Diego (admin)
  'active'
) ON CONFLICT DO NOTHING;