-- Populate beep_questions table with static data using deterministic UUIDs
-- First, let's create a function to generate the same UUIDs as the frontend
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to generate deterministic UUIDs like the frontend
CREATE OR REPLACE FUNCTION generate_beep_question_uuid(subcategory_slug TEXT, question_index INTEGER)
RETURNS UUID AS $$
DECLARE
  namespace_uuid UUID := '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  input_string TEXT;
BEGIN
  input_string := subcategory_slug || '-' || question_index;
  RETURN uuid_generate_v5(namespace_uuid, input_string);
END;
$$ LANGUAGE plpgsql;

-- Insert questions for "problema" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('problema', 0), (SELECT id FROM beep_subcategories WHERE slug = 'problema'), 'Nossa startup tem uma definição clara do problema que está resolvendo', 1, 0),
(generate_beep_question_uuid('problema', 1), (SELECT id FROM beep_subcategories WHERE slug = 'problema'), 'O problema que resolvemos é significativo e afeta um grande número de pessoas', 1, 1),
(generate_beep_question_uuid('problema', 2), (SELECT id FROM beep_subcategories WHERE slug = 'problema'), 'Temos evidências quantitativas e qualitativas que comprovam a existência do problema', 1, 2),
(generate_beep_question_uuid('problema', 3), (SELECT id FROM beep_subcategories WHERE slug = 'problema'), 'O problema identificado tem potencial para gerar um negócio sustentável', 1, 3),
(generate_beep_question_uuid('problema', 4), (SELECT id FROM beep_subcategories WHERE slug = 'problema'), 'Conseguimos articular o problema de forma simples e clara para diferentes audiências', 1, 4);

-- Insert questions for "validacao" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('validacao', 0), (SELECT id FROM beep_subcategories WHERE slug = 'validacao'), 'Realizamos pesquisas com potenciais clientes para validar o problema', 1, 0),
(generate_beep_question_uuid('validacao', 1), (SELECT id FROM beep_subcategories WHERE slug = 'validacao'), 'Temos feedback direto de pessoas que enfrentam o problema identificado', 1, 1),
(generate_beep_question_uuid('validacao', 2), (SELECT id FROM beep_subcategories WHERE slug = 'validacao'), 'Conseguimos demonstrar que as pessoas estão dispostas a pagar por uma solução', 1, 2),
(generate_beep_question_uuid('validacao', 3), (SELECT id FROM beep_subcategories WHERE slug = 'validacao'), 'Temos evidências de que outras soluções no mercado não atendem adequadamente', 1, 3),
(generate_beep_question_uuid('validacao', 4), (SELECT id FROM beep_subcategories WHERE slug = 'validacao'), 'Validamos que nosso público-alvo realmente existe e é acessível', 1, 4);

-- Insert questions for "publico" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('publico', 0), (SELECT id FROM beep_subcategories WHERE slug = 'publico'), 'Temos uma definição clara e específica do nosso público-alvo', 1, 0),
(generate_beep_question_uuid('publico', 1), (SELECT id FROM beep_subcategories WHERE slug = 'publico'), 'Conhecemos as características demográficas e psicográficas dos nossos clientes', 1, 1),
(generate_beep_question_uuid('publico', 2), (SELECT id FROM beep_subcategories WHERE slug = 'publico'), 'Entendemos os comportamentos e hábitos de consumo do nosso público', 1, 2),
(generate_beep_question_uuid('publico', 3), (SELECT id FROM beep_subcategories WHERE slug = 'publico'), 'Sabemos onde encontrar e como nos comunicar com nosso público-alvo', 1, 3),
(generate_beep_question_uuid('publico', 4), (SELECT id FROM beep_subcategories WHERE slug = 'publico'), 'Conseguimos estimar o tamanho do mercado para nosso produto/serviço', 1, 4);

-- Insert questions for "solucao" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('solucao', 0), (SELECT id FROM beep_subcategories WHERE slug = 'solucao'), 'Nossa solução endereça diretamente o problema identificado', 1, 0),
(generate_beep_question_uuid('solucao', 1), (SELECT id FROM beep_subcategories WHERE slug = 'solucao'), 'A solução é tecnicamente viável com os recursos disponíveis', 1, 1),
(generate_beep_question_uuid('solucao', 2), (SELECT id FROM beep_subcategories WHERE slug = 'solucao'), 'Nossa abordagem é diferenciada das soluções existentes no mercado', 1, 2),
(generate_beep_question_uuid('solucao', 3), (SELECT id FROM beep_subcategories WHERE slug = 'solucao'), 'A solução pode ser desenvolvida e entregue dentro do cronograma planejado', 1, 3),
(generate_beep_question_uuid('solucao', 4), (SELECT id FROM beep_subcategories WHERE slug = 'solucao'), 'Temos capacidade técnica ou acesso aos recursos necessários para desenvolver a solução', 1, 4);

-- Insert questions for "mvp" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('mvp', 0), (SELECT id FROM beep_subcategories WHERE slug = 'mvp'), 'Definimos claramente quais são as funcionalidades mínimas do nosso produto', 1, 0),
(generate_beep_question_uuid('mvp', 1), (SELECT id FROM beep_subcategories WHERE slug = 'mvp'), 'Nosso MVP resolve o problema principal identificado', 1, 1),
(generate_beep_question_uuid('mvp', 2), (SELECT id FROM beep_subcategories WHERE slug = 'mvp'), 'Conseguimos desenvolver o MVP com os recursos atuais', 1, 2),
(generate_beep_question_uuid('mvp', 3), (SELECT id FROM beep_subcategories WHERE slug = 'mvp'), 'Temos um plano claro para testar e iterar o MVP', 1, 3),
(generate_beep_question_uuid('mvp', 4), (SELECT id FROM beep_subcategories WHERE slug = 'mvp'), 'O MVP pode ser lançado em um prazo realista', 1, 4);

-- Insert questions for "teste" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('teste', 0), (SELECT id FROM beep_subcategories WHERE slug = 'teste'), 'Temos uma estratégia definida para testar nosso produto com usuários reais', 1, 0),
(generate_beep_question_uuid('teste', 1), (SELECT id FROM beep_subcategories WHERE slug = 'teste'), 'Estabelecemos métricas claras para medir o sucesso dos testes', 1, 1),
(generate_beep_question_uuid('teste', 2), (SELECT id FROM beep_subcategories WHERE slug = 'teste'), 'Temos acesso a usuários dispostos a testar nosso produto', 1, 2),
(generate_beep_question_uuid('teste', 3), (SELECT id FROM beep_subcategories WHERE slug = 'teste'), 'Conseguimos coletar e analisar feedback dos testes de forma sistemática', 1, 3),
(generate_beep_question_uuid('teste', 4), (SELECT id FROM beep_subcategories WHERE slug = 'teste'), 'Usamos os resultados dos testes para iterar e melhorar nosso produto', 1, 4);

-- Insert questions for "modelo-negocio" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('modelo-negocio', 0), (SELECT id FROM beep_subcategories WHERE slug = 'modelo-negocio'), 'Temos uma definição clara de como nossa startup vai gerar receita', 1, 0),
(generate_beep_question_uuid('modelo-negocio', 1), (SELECT id FROM beep_subcategories WHERE slug = 'modelo-negocio'), 'Nosso modelo de negócio é sustentável a longo prazo', 1, 1),
(generate_beep_question_uuid('modelo-negocio', 2), (SELECT id FROM beep_subcategories WHERE slug = 'modelo-negocio'), 'Identificamos as principais fontes de custo do nosso negócio', 1, 2),
(generate_beep_question_uuid('modelo-negocio', 3), (SELECT id FROM beep_subcategories WHERE slug = 'modelo-negocio'), 'Conseguimos explicar nosso modelo de negócio de forma simples e clara', 1, 3),
(generate_beep_question_uuid('modelo-negocio', 4), (SELECT id FROM beep_subcategories WHERE slug = 'modelo-negocio'), 'Temos projeções realistas de receita e crescimento', 1, 4);

-- Insert questions for "receita" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('receita', 0), (SELECT id FROM beep_subcategories WHERE slug = 'receita'), 'Definimos uma estratégia de precificação baseada no valor entregue', 1, 0),
(generate_beep_question_uuid('receita', 1), (SELECT id FROM beep_subcategories WHERE slug = 'receita'), 'Testamos diferentes modelos de preço com potenciais clientes', 1, 1),
(generate_beep_question_uuid('receita', 2), (SELECT id FROM beep_subcategories WHERE slug = 'receita'), 'Temos múltiplas fontes potenciais de receita identificadas', 1, 2),
(generate_beep_question_uuid('receita', 3), (SELECT id FROM beep_subcategories WHERE slug = 'receita'), 'Nossa estrutura de preços é competitiva no mercado', 1, 3),
(generate_beep_question_uuid('receita', 4), (SELECT id FROM beep_subcategories WHERE slug = 'receita'), 'Conseguimos prever quando alcançaremos o ponto de equilíbrio', 1, 4);

-- Insert questions for "custos" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('custos', 0), (SELECT id FROM beep_subcategories WHERE slug = 'custos'), 'Mapeamos todos os custos fixos e variáveis do nosso negócio', 1, 0),
(generate_beep_question_uuid('custos', 1), (SELECT id FROM beep_subcategories WHERE slug = 'custos'), 'Temos controle sobre nossos principais direcionadores de custo', 1, 1),
(generate_beep_question_uuid('custos', 2), (SELECT id FROM beep_subcategories WHERE slug = 'custos'), 'Nossa estrutura de custos permite escalabilidade', 1, 2),
(generate_beep_question_uuid('custos', 3), (SELECT id FROM beep_subcategories WHERE slug = 'custos'), 'Conseguimos operar com margens saudáveis', 1, 3),
(generate_beep_question_uuid('custos', 4), (SELECT id FROM beep_subcategories WHERE slug = 'custos'), 'Temos estratégias para otimizar custos conforme crescemos', 1, 4);

-- Insert questions for "recursos" subcategory  
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('recursos', 0), (SELECT id FROM beep_subcategories WHERE slug = 'recursos'), 'Identificamos todos os recursos-chave necessários para nosso negócio', 1, 0),
(generate_beep_question_uuid('recursos', 1), (SELECT id FROM beep_subcategories WHERE slug = 'recursos'), 'Temos acesso aos recursos técnicos necessários', 1, 1),
(generate_beep_question_uzz('recursos', 2), (SELECT id FROM beep_subcategories WHERE slug = 'recursos'), 'Conseguimos acessar os recursos humanos com as competências necessárias', 1, 2),
(generate_beep_question_uuid('recursos', 3), (SELECT id FROM beep_subcategories WHERE slug = 'recursos'), 'Temos ou conseguimos obter os recursos financeiros necessários', 1, 3),
(generate_beep_question_uuid('recursos', 4), (SELECT id FROM beep_subcategories WHERE slug = 'recursos'), 'Nossos recursos principais são sustentáveis e escaláveis', 1, 4);

-- Insert questions for "parcerias" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('parcerias', 0), (SELECT id FROM beep_subcategories WHERE slug = 'parcerias'), 'Identificamos parceiros-chave que podem acelerar nosso crescimento', 1, 0),
(generate_beep_question_uuid('parcerias', 1), (SELECT id FROM beep_subcategories WHERE slug = 'parcerias'), 'Temos relacionamentos estabelecidos com fornecedores importantes', 1, 1),
(generate_beep_question_uuid('parcerias', 2), (SELECT id FROM beep_subcategories WHERE slug = 'parcerias'), 'Conseguimos estabelecer parcerias estratégicas relevantes', 1, 2),
(generate_beep_question_uuid('parcerias', 3), (SELECT id FROM beep_subcategories WHERE slug = 'parcerias'), 'Nossas parcerias agregam valor real ao nosso negócio', 1, 3),
(generate_beep_question_uuid('parcerias', 4), (SELECT id FROM beep_subcategories WHERE slug = 'parcerias'), 'Temos estratégias para manter e fortalecer parcerias importantes', 1, 4);

-- Insert questions for "canais" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('canais', 0), (SELECT id FROM beep_subcategories WHERE slug = 'canais'), 'Definimos os canais mais eficazes para alcançar nosso público-alvo', 1, 0),
(generate_beep_question_uuid('canais', 1), (SELECT id FROM beep_subcategories WHERE slug = 'canais'), 'Testamos diferentes canais de aquisição de clientes', 1, 1),
(generate_beep_question_uuid('canais', 2), (SELECT id FROM beep_subcategories WHERE slug = 'canais'), 'Conseguimos medir o custo de aquisição por canal', 1, 2),
(generate_beep_question_uuid('canais', 3), (SELECT id FROM beep_subcategories WHERE slug = 'canais'), 'Temos uma estratégia multicanal integrada', 1, 3),
(generate_beep_question_uuid('canais', 4), (SELECT id FROM beep_subcategories WHERE slug = 'canais'), 'Nossos canais de distribuição são escaláveis', 1, 4);

-- Insert questions for "relacionamento" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('relacionamento', 0), (SELECT id FROM beep_subcategories WHERE slug = 'relacionamento'), 'Temos uma estratégia clara para nos relacionar com nossos clientes', 1, 0),
(generate_beep_question_uuid('relacionamento', 1), (SELECT id FROM beep_subcategories WHERE slug = 'relacionamento'), 'Conseguimos manter contato regular e relevante com nossa base de clientes', 1, 1),
(generate_beep_question_uuid('relacionamento', 2), (SELECT id FROM beep_subcategories WHERE slug = 'relacionamento'), 'Temos processos para coletar e responder ao feedback dos clientes', 1, 2),
(generate_beep_question_uuid('relacionamento', 3), (SELECT id FROM beep_subcategories WHERE slug = 'relacionamento'), 'Conseguimos fidelizar clientes e gerar relacionamentos duradouros', 1, 3),
(generate_beep_question_uuid('relacionamento', 4), (SELECT id FROM beep_subcategories WHERE slug = 'relacionamento'), 'Temos estratégias para transformar clientes em defensores da nossa marca', 1, 4);

-- Insert questions for "equipe" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('equipe', 0), (SELECT id FROM beep_subcategories WHERE slug = 'equipe'), 'Nossa equipe possui as competências necessárias para executar nosso plano', 1, 0),
(generate_beep_question_uuid('equipe', 1), (SELECT id FROM beep_subcategories WHERE slug = 'equipe'), 'Temos uma divisão clara de papéis e responsabilidades', 1, 1),
(generate_beep_question_uuid('equipe', 2), (SELECT id FROM beep_subcategories WHERE slug = 'equipe'), 'A equipe tem experiência relevante na área de atuação', 1, 2),
(generate_beep_question_uuid('equipe', 3), (SELECT id FROM beep_subcategories WHERE slug = 'equipe'), 'Conseguimos atrair e reter talentos necessários para o crescimento', 1, 3),
(generate_beep_question_uuid('equipe', 4), (SELECT id FROM beep_subcategories WHERE slug = 'equipe'), 'Temos um ambiente de trabalho produtivo e colaborativo', 1, 4);

-- Insert questions for "lideranca" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('lideranca', 0), (SELECT id FROM beep_subcategories WHERE slug = 'lideranca'), 'A liderança tem visão clara e consegue comunicá-la efetivamente', 1, 0),
(generate_beep_question_uuid('lideranca', 1), (SELECT id FROM beep_subcategories WHERE slug = 'lideranca'), 'Temos processos de tomada de decisão ágeis e eficazes', 1, 1),
(generate_beep_question_uuid('lideranca', 2), (SELECT id FROM beep_subcategories WHERE slug = 'lideranca'), 'A liderança consegue motivar e engajar a equipe', 1, 2),
(generate_beep_question_uuid('lideranca', 3), (SELECT id FROM beep_subcategories WHERE slug = 'lideranca'), 'Temos capacidade para liderar mudanças e adaptações necessárias', 1, 3),
(generate_beep_question_uuid('lideranca', 4), (SELECT id FROM beep_subcategories WHERE slug = 'lideranca'), 'A liderança demonstra comprometimento e dedicação ao negócio', 1, 4);

-- Insert questions for "cultura" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('cultura', 0), (SELECT id FROM beep_subcategories WHERE slug = 'cultura'), 'Definimos valores e princípios claros para nossa startup', 1, 0),
(generate_beep_question_uuid('cultura', 1), (SELECT id FROM beep_subcategories WHERE slug = 'cultura'), 'Nossa cultura promove inovação e experimentação', 1, 1),
(generate_beep_question_uuid('cultura', 2), (SELECT id FROM beep_subcategories WHERE slug = 'cultura'), 'Temos um ambiente que incentiva aprendizado contínuo', 1, 2),
(generate_beep_question_uuid('cultura', 3), (SELECT id FROM beep_subcategories WHERE slug = 'cultura'), 'Nossa cultura é inclusiva e valoriza a diversidade', 1, 3),
(generate_beep_question_uuid('cultura', 4), (SELECT id FROM beep_subcategories WHERE slug = 'cultura'), 'Conseguimos manter nossa cultura mesmo com o crescimento', 1, 4);

-- Insert questions for "processos" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('processos', 0), (SELECT id FROM beep_subcategories WHERE slug = 'processos'), 'Temos processos documentados para as principais atividades do negócio', 1, 0),
(generate_beep_question_uuid('processos', 1), (SELECT id FROM beep_subcategories WHERE slug = 'processos'), 'Nossos processos são eficientes e geram valor', 1, 1),
(generate_beep_question_uuid('processos', 2), (SELECT id FROM beep_subcategories WHERE slug = 'processos'), 'Conseguimos melhorar continuamente nossos processos', 1, 2),
(generate_beep_question_uuid('processos', 3), (SELECT id FROM beep_subcategories WHERE slug = 'processos'), 'Temos sistemas e ferramentas adequados para nossos processos', 1, 3),
(generate_beep_question_uuid('processos', 4), (SELECT id FROM beep_subcategories WHERE slug = 'processos'), 'Nossos processos são escaláveis e se adaptam ao crescimento', 1, 4);

-- Insert questions for "metricas" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('metricas', 0), (SELECT id FROM beep_subcategories WHERE slug = 'metricas'), 'Definimos métricas-chave para acompanhar o desempenho do negócio', 1, 0),
(generate_beep_question_uuid('metricas', 1), (SELECT id FROM beep_subcategories WHERE slug = 'metricas'), 'Conseguimos coletar e analisar dados relevantes regularmente', 1, 1),
(generate_beep_question_uuid('metricas', 2), (SELECT id FROM beep_subcategories WHERE slug = 'metricas'), 'Usamos métricas para tomar decisões estratégicas', 1, 2),
(generate_beep_question_uuid('metricas', 3), (SELECT id FROM beep_subcategories WHERE slug = 'metricas'), 'Temos dashboards e relatórios que facilitam o acompanhamento', 1, 3),
(generate_beep_question_uuid('metricas', 4), (SELECT id FROM beep_subcategories WHERE slug = 'metricas'), 'Conseguimos identificar tendências e padrões nos nossos dados', 1, 4);

-- Insert questions for "financeiro" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('financeiro', 0), (SELECT id FROM beep_subcategories WHERE slug = 'financeiro'), 'Temos controle rigoroso sobre nossas finanças', 1, 0),
(generate_beep_question_uuid('financeiro', 1), (SELECT id FROM beep_subcategories WHERE slug = 'financeiro'), 'Conseguimos fazer projeções financeiras realistas', 1, 1),
(generate_beep_question_uuid('financeiro', 2), (SELECT id FROM beep_subcategories WHERE slug = 'financeiro'), 'Temos reservas financeiras adequadas para nossa operação', 1, 2),
(generate_beep_question_uuid('financeiro', 3), (SELECT id FROM beep_subcategories WHERE slug = 'financeiro'), 'Conseguimos acessar capital quando necessário', 1, 3),
(generate_beep_question_uuid('financeiro', 4), (SELECT id FROM beep_subcategories WHERE slug = 'financeiro'), 'Temos transparência e governança financeira adequadas', 1, 4);

-- Insert questions for "conformidade" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('conformidade', 0), (SELECT id FROM beep_subcategories WHERE slug = 'conformidade'), 'Conhecemos todas as regulamentações aplicáveis ao nosso negócio', 1, 0),
(generate_beep_question_uuid('conformidade', 1), (SELECT id FROM beep_subcategories WHERE slug = 'conformidade'), 'Estamos em conformidade com as exigências legais e regulatórias', 1, 1),
(generate_beep_question_uuid('conformidade', 2), (SELECT id FROM beep_subcategories WHERE slug = 'conformidade'), 'Temos processos para manter conformidade contínua', 1, 2),
(generate_beep_question_uuid('conformidade', 3), (SELECT id FROM beep_subcategories WHERE slug = 'conformidade'), 'Conseguimos adaptar-nos a mudanças regulatórias', 1, 3),
(generate_beep_question_uuid('conformidade', 4), (SELECT id FROM beep_subcategories WHERE slug = 'conformidade'), 'Temos assessoria jurídica adequada para nosso setor', 1, 4);

-- Drop the helper function after use
DROP FUNCTION generate_beep_question_uuid(TEXT, INTEGER);