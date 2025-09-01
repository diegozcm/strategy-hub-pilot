-- Criar relações mentor-startup entre mentores existente e startups
-- Primeiro, vamos verificar se já temos mentores e startups

-- Inserir relações mentor-startup para os mentores existentes
INSERT INTO public.mentor_startup_relations (
  mentor_id, 
  startup_company_id, 
  assigned_by, 
  status
) 
SELECT 
  m.user_id as mentor_id,
  s.id as startup_company_id,
  m.user_id as assigned_by, -- Por simplicidade, o próprio mentor se auto-atribui
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

-- Criar dicas de mentoria de exemplo
-- Primeiro, vamos pegar os IDs dos mentores e startups
WITH mentors AS (
  SELECT shp.user_id, p.first_name, p.last_name
  FROM public.startup_hub_profiles shp
  JOIN public.profiles p ON p.user_id = shp.user_id
  WHERE shp.type = 'mentor' AND shp.status = 'active'
  LIMIT 2
),
startups AS (
  SELECT c.id
  FROM public.companies c
  WHERE c.company_type = 'startup' AND c.status = 'active'
  LIMIT 1
)

-- Inserir dicas de mentoria variadas
INSERT INTO public.mentoring_tips (
  mentor_id,
  startup_company_id,
  title,
  content,
  category,
  priority,
  is_public,
  status
) 
-- Dicas do primeiro mentor
SELECT 
  m.user_id,
  s.id,
  'Foque na validação do problema',
  'Antes de desenvolver qualquer solução, certifique-se de que você realmente entende o problema que está tentando resolver. Converse com pelo menos 20 potenciais clientes para validar suas hipóteses.',
  'geral',
  'alta',
  false,
  'published'
FROM mentors m, startups s
WHERE m.first_name = 'Leonardo'
LIMIT 1

UNION ALL

SELECT 
  m.user_id,
  s.id,
  'Construa um MVP funcional',
  'Desenvolva a versão mais simples do seu produto que ainda resolve o problema principal. Evite adicionar funcionalidades desnecessárias no início.',
  'produto',
  'alta',
  false,
  'published'
FROM mentors m, startups s
WHERE m.first_name = 'Leonardo'
LIMIT 1

UNION ALL

SELECT 
  m.user_id,
  NULL, -- Dica pública
  'Gerenciamento de fluxo de caixa',
  'Mantenha um controle rigoroso do seu fluxo de caixa. Saiba exatamente quanto dinheiro entra e sai da empresa mensalmente. Use planilhas ou ferramentas específicas para isso.',
  'financeiro',
  'media',
  true,
  'published'
FROM mentors m
WHERE m.first_name = 'Leonardo'
LIMIT 1

UNION ALL

-- Dicas do segundo mentor
SELECT 
  m.user_id,
  s.id,
  'Marketing digital é essencial',
  'Invista em criar uma presença forte nas redes sociais. Identifique onde seu público-alvo está mais ativo e foque seus esforços nessas plataformas.',
  'marketing',
  'media',
  false,
  'published'
FROM mentors m, startups s
WHERE m.first_name = 'Diego'
LIMIT 1

UNION ALL

SELECT 
  m.user_id,
  s.id,
  'Tecnologia deve ser um meio, não um fim',
  'Não se apaixone pela tecnologia pela tecnologia. Escolha as ferramentas e tecnologias que realmente agregam valor ao seu negócio e são sustentáveis a longo prazo.',
  'tecnologia',
  'baixa',
  false,
  'published'
FROM mentors m, startups s
WHERE m.first_name = 'Diego'
LIMIT 1

UNION ALL

SELECT 
  m.user_id,
  NULL, -- Dica pública
  'Processo de vendas estruturado',
  'Desenvolva um processo de vendas claro e replicável. Documente cada etapa, desde a prospecção até o fechamento, para que sua equipe possa seguir um padrão.',
  'vendas',
  'alta',
  true,
  'published'
FROM mentors m
WHERE m.first_name = 'Diego'
LIMIT 1

UNION ALL

SELECT 
  m.user_id,
  NULL, -- Dica pública
  'Network é fundamental',
  'Participe de eventos do ecossistema de startups, conecte-se com outros empreendedores e potenciais investidores. O networking pode abrir portas que você nem imaginava.',
  'geral',
  'media',
  true,
  'published'
FROM mentors m
WHERE m.first_name = 'Leonardo'
LIMIT 1

UNION ALL

SELECT 
  m.user_id,
  s.id,
  'Métricas que realmente importam',
  'Foque nas métricas que realmente indicam o sucesso do seu negócio. Para cada startup é diferente, mas geralmente incluem CAC (Custo de Aquisição de Cliente), LTV (Lifetime Value) e churn rate.',
  'geral',
  'alta',
  false,
  'published'
FROM mentors m, startups s
WHERE m.first_name = 'Diego'
LIMIT 1;