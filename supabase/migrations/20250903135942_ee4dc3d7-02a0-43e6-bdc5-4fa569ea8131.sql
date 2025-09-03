-- Criar uma sessão de mentoria de exemplo para demonstração
INSERT INTO public.mentoring_sessions (
  mentor_id,
  startup_company_id,
  session_date,
  duration,
  session_type,
  notes,
  action_items,
  status
) VALUES (
  '35749be5-8520-4d39-a98f-299af5ca5af9', -- Diego Zagonel
  '5f175c2e-f926-4ecd-a989-8b9620c7bec0', -- Chá Clube
  '2025-09-03 14:00:00+00', -- Hoje às 14h
  60, -- 1 hora
  'general',
  'Reunião inicial de alinhamento estratégico. Discutimos o modelo de negócio do Chá Clube e principais desafios no mercado de chás premium.',
  '["Definir personas principais do público-alvo", "Realizar pesquisa de mercado com 20 potenciais clientes", "Criar MVP da plataforma de e-commerce", "Desenvolver identidade visual da marca"]',
  'completed'
) ON CONFLICT DO NOTHING;