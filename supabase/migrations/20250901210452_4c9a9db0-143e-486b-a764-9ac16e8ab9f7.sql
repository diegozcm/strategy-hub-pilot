-- Criar relações mentor-startup entre mentores existentes e startups
INSERT INTO public.mentor_startup_relations (
  mentor_id, 
  startup_company_id, 
  assigned_by, 
  status
) 
SELECT 
  shp.user_id as mentor_id,
  c.id as startup_company_id,
  shp.user_id as assigned_by,
  'active'
FROM public.startup_hub_profiles shp
CROSS JOIN public.companies c
WHERE shp.type = 'mentor' 
  AND shp.status = 'active'
  AND c.company_type = 'startup' 
  AND c.status = 'active'
ON CONFLICT (mentor_id, startup_company_id) DO NOTHING;

-- Criar dicas de mentoria de exemplo
-- Obter o ID do primeiro mentor (Leonardo)
INSERT INTO public.mentoring_tips (
  mentor_id,
  startup_company_id,
  title,
  content,
  category,
  priority,
  is_public,
  status
) VALUES
-- Dicas direcionadas do Leonardo
(
  (SELECT shp.user_id FROM public.startup_hub_profiles shp 
   JOIN public.profiles p ON p.user_id = shp.user_id 
   WHERE shp.type = 'mentor' AND p.first_name = 'Leonardo' LIMIT 1),
  (SELECT id FROM public.companies WHERE company_type = 'startup' LIMIT 1),
  'Foque na validação do problema',
  'Antes de desenvolver qualquer solução, certifique-se de que você realmente entende o problema que está tentando resolver. Converse com pelo menos 20 potenciais clientes para validar suas hipóteses.',
  'geral',
  'alta',
  false,
  'published'
),
(
  (SELECT shp.user_id FROM public.startup_hub_profiles shp 
   JOIN public.profiles p ON p.user_id = shp.user_id 
   WHERE shp.type = 'mentor' AND p.first_name = 'Leonardo' LIMIT 1),
  (SELECT id FROM public.companies WHERE company_type = 'startup' LIMIT 1),
  'Construa um MVP funcional',
  'Desenvolva a versão mais simples do seu produto que ainda resolve o problema principal. Evite adicionar funcionalidades desnecessárias no início.',
  'produto',
  'alta',
  false,
  'published'
),
-- Dica pública do Leonardo
(
  (SELECT shp.user_id FROM public.startup_hub_profiles shp 
   JOIN public.profiles p ON p.user_id = shp.user_id 
   WHERE shp.type = 'mentor' AND p.first_name = 'Leonardo' LIMIT 1),
  NULL,
  'Gerenciamento de fluxo de caixa',
  'Mantenha um controle rigoroso do seu fluxo de caixa. Saiba exatamente quanto dinheiro entra e sai da empresa mensalmente. Use planilhas ou ferramentas específicas para isso.',
  'financeiro',
  'media',
  true,
  'published'
),
(
  (SELECT shp.user_id FROM public.startup_hub_profiles shp 
   JOIN public.profiles p ON p.user_id = shp.user_id 
   WHERE shp.type = 'mentor' AND p.first_name = 'Leonardo' LIMIT 1),
  NULL,
  'Network é fundamental',
  'Participe de eventos do ecossistema de startups, conecte-se com outros empreendedores e potenciais investidores. O networking pode abrir portas que você nem imaginava.',
  'geral',
  'media',
  true,
  'published'
),
-- Dicas direcionadas do Diego
(
  (SELECT shp.user_id FROM public.startup_hub_profiles shp 
   JOIN public.profiles p ON p.user_id = shp.user_id 
   WHERE shp.type = 'mentor' AND p.first_name = 'Diego' LIMIT 1),
  (SELECT id FROM public.companies WHERE company_type = 'startup' LIMIT 1),
  'Marketing digital é essencial',
  'Invista em criar uma presença forte nas redes sociais. Identifique onde seu público-alvo está mais ativo e foque seus esforços nessas plataformas.',
  'marketing',
  'media',
  false,
  'published'
),
(
  (SELECT shp.user_id FROM public.startup_hub_profiles shp 
   JOIN public.profiles p ON p.user_id = shp.user_id 
   WHERE shp.type = 'mentor' AND p.first_name = 'Diego' LIMIT 1),
  (SELECT id FROM public.companies WHERE company_type = 'startup' LIMIT 1),
  'Tecnologia deve ser um meio, não um fim',
  'Não se apaixone pela tecnologia pela tecnologia. Escolha as ferramentas e tecnologias que realmente agregam valor ao seu negócio e são sustentáveis a longo prazo.',
  'tecnologia',
  'baixa',
  false,
  'published'
),
(
  (SELECT shp.user_id FROM public.startup_hub_profiles shp 
   JOIN public.profiles p ON p.user_id = shp.user_id 
   WHERE shp.type = 'mentor' AND p.first_name = 'Diego' LIMIT 1),
  (SELECT id FROM public.companies WHERE company_type = 'startup' LIMIT 1),
  'Métricas que realmente importam',
  'Foque nas métricas que realmente indicam o sucesso do seu negócio. Para cada startup é diferente, mas geralmente incluem CAC (Custo de Aquisição de Cliente), LTV (Lifetime Value) e churn rate.',
  'geral',
  'alta',
  false,
  'published'
),
-- Dica pública do Diego
(
  (SELECT shp.user_id FROM public.startup_hub_profiles shp 
   JOIN public.profiles p ON p.user_id = shp.user_id 
   WHERE shp.type = 'mentor' AND p.first_name = 'Diego' LIMIT 1),
  NULL,
  'Processo de vendas estruturado',
  'Desenvolva um processo de vendas claro e replicável. Documente cada etapa, desde a prospecção até o fechamento, para que sua equipe possa seguir um padrão.',
  'vendas',
  'alta',
  true,
  'published'
);