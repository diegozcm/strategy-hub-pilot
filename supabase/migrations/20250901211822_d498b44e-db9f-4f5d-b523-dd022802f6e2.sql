-- Inserir dicas de mentoria de exemplo para a Startup BETA
INSERT INTO public.mentoring_tips (
  mentor_id,
  startup_company_id,
  title,
  content,
  category,
  priority,
  is_public
) VALUES 
-- Dica direcionada para Startup BETA
(
  (SELECT user_id FROM public.profiles WHERE email = 'admin@example.com' LIMIT 1),
  (SELECT id FROM public.companies WHERE name = 'Startup BETA' AND company_type = 'startup' LIMIT 1),
  'Foco na Validação do MVP',
  'É fundamental validar suas hipóteses de negócio antes de investir pesado no desenvolvimento. Recomendo que vocês façam entrevistas com pelo menos 20 potenciais clientes para entender melhor suas dores e necessidades. Isso vai economizar tempo e recursos no futuro.',
  'produto',
  'alta',
  false
),
-- Dica pública sobre financeiro
(
  (SELECT user_id FROM public.profiles WHERE email = 'admin@example.com' LIMIT 1),
  NULL,
  'Gestão de Fluxo de Caixa para Startups',
  'O fluxo de caixa é a alma do negócio. Mantenham sempre uma projeção de pelo menos 6 meses e tenham uma reserva de emergência. Utilizem ferramentas como planilhas ou softwares de gestão financeira para acompanhar receitas e despesas diariamente.',
  'financeiro',
  'alta',
  true
),
-- Dica direcionada sobre marketing
(
  (SELECT user_id FROM public.profiles WHERE email = 'admin@example.com' LIMIT 1),
  (SELECT id FROM public.companies WHERE name = 'Startup BETA' AND company_type = 'startup' LIMIT 1),
  'Estratégia de Marketing Digital Focada',
  'Baseado no perfil da Startup BETA, sugiro focarem em marketing de conteúdo no LinkedIn e desenvolvimento de parcerias estratégicas. Evitem tentar estar em todas as redes sociais - escolham 2 canais e dominem eles completamente.',
  'marketing',
  'media',
  false
),
-- Dica pública sobre vendas
(
  (SELECT user_id FROM public.profiles WHERE email = 'admin@example.com' LIMIT 1),
  NULL,
  'Processo de Vendas Estruturado',
  'Criem um funil de vendas bem definido com etapas claras: prospecção, qualificação, apresentação, negociação e fechamento. Documentem todas as objeções comuns e preparem respostas padronizadas. Isso vai acelerar o ciclo de vendas.',
  'vendas',
  'media',
  true
);