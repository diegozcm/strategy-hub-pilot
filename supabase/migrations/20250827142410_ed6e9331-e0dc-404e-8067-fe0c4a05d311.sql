-- Populate beep_questions table using existing subcategories with deterministic UUIDs
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
(generate_beep_question_uuid('problema', 0), '191ff7f0-3668-4125-a054-4fd6b8e381a0', 'Você consegue descrever claramente qual problema seu negócio resolve?', 1, 0),
(generate_beep_question_uuid('problema', 1), '191ff7f0-3668-4125-a054-4fd6b8e381a0', 'Você validou se este problema realmente existe e é relevante para seu público-alvo?', 1, 1),
(generate_beep_question_uuid('problema', 2), '191ff7f0-3668-4125-a054-4fd6b8e381a0', 'Você conhece outras soluções existentes para este problema?', 1, 2),
(generate_beep_question_uuid('problema', 3), '191ff7f0-3668-4125-a054-4fd6b8e381a0', 'Você consegue quantificar o impacto deste problema na vida das pessoas?', 1, 3),
(generate_beep_question_uuid('problema', 4), '191ff7f0-3668-4125-a054-4fd6b8e381a0', 'Você tem evidências de que as pessoas pagariam para resolver este problema?', 1, 4),
(generate_beep_question_uuid('problema', 5), '191ff7f0-3668-4125-a054-4fd6b8e381a0', 'Você identificou se este problema está crescendo ou diminuindo ao longo do tempo?', 1, 5),
(generate_beep_question_uuid('problema', 6), '191ff7f0-3668-4125-a054-4fd6b8e381a0', 'Você consegue explicar por que este problema ainda não foi resolvido adequadamente?', 1, 6),
(generate_beep_question_uuid('problema', 7), '191ff7f0-3668-4125-a054-4fd6b8e381a0', 'Você tem dados sobre a frequência com que este problema ocorre?', 1, 7),
(generate_beep_question_uuid('problema', 8), '191ff7f0-3668-4125-a054-4fd6b8e381a0', 'Você identificou diferentes segmentos que enfrentam este problema?', 1, 8),
(generate_beep_question_uuid('problema', 9), '191ff7f0-3668-4125-a054-4fd6b8e381a0', 'Você consegue priorizar qual aspecto do problema é mais crítico?', 1, 9);

-- Insert questions for "validacao" subcategory  
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('validacao', 0), '9ae0c9c2-d31a-4404-baf3-e5c7013191ac', 'Você já testou sua ideia com potenciais clientes?', 1, 0),
(generate_beep_question_uuid('validacao', 1), '9ae0c9c2-d31a-4404-baf3-e5c7013191ac', 'Você coletou feedback estruturado sobre sua proposta de valor?', 1, 1),
(generate_beep_question_uuid('validacao', 2), '9ae0c9c2-d31a-4404-baf3-e5c7013191ac', 'Você já fez entrevistas com pelo menos 10 potenciais clientes?', 1, 2),
(generate_beep_question_uuid('validacao', 3), '9ae0c9c2-d31a-4404-baf3-e5c7013191ac', 'Você tem métricas que comprovam o interesse dos clientes em sua solução?', 1, 3),
(generate_beep_question_uuid('validacao', 4), '9ae0c9c2-d31a-4404-baf3-e5c7013191ac', 'Você já criou protótipos ou MVPs para testar suas hipóteses?', 1, 4),
(generate_beep_question_uuid('validacao', 5), '9ae0c9c2-d31a-4404-baf3-e5c7013191ac', 'Você documentou os aprendizados obtidos durante o processo de validação?', 1, 5),
(generate_beep_question_uuid('validacao', 6), '9ae0c9c2-d31a-4404-baf3-e5c7013191ac', 'Você já pivot ou ajustou sua ideia com base nos feedbacks recebidos?', 1, 6),
(generate_beep_question_uuid('validacao', 7), '9ae0c9c2-d31a-4404-baf3-e5c7013191ac', 'Você tem um processo sistemático para validar novas hipóteses?', 1, 7),
(generate_beep_question_uuid('validacao', 8), '9ae0c9c2-d31a-4404-baf3-e5c7013191ac', 'Você consegue medir se sua solução realmente resolve o problema identificado?', 1, 8),
(generate_beep_question_uuid('validacao', 9), '9ae0c9c2-d31a-4404-baf3-e5c7013191ac', 'Você validou se existe demanda suficiente para tornar o negócio viável?', 1, 9);

-- Insert questions for "cliente" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('cliente', 0), '7b011ea0-70e3-4ff4-91a8-73acbdf31ee1', 'Você consegue descrever detalhadamente quem é seu cliente ideal?', 1, 0),
(generate_beep_question_uuid('cliente', 1), '7b011ea0-70e3-4ff4-91a8-73acbdf31ee1', 'Você conhece os hábitos e comportamentos dos seus clientes?', 1, 1),
(generate_beep_question_uuid('cliente', 2), '7b011ea0-70e3-4ff4-91a8-73acbdf31ee1', 'Você sabe onde encontrar seus clientes potenciais?', 1, 2),
(generate_beep_question_uuid('cliente', 3), '7b011ea0-70e3-4ff4-91a8-73acbdf31ee1', 'Você entende as motivações e dores dos seus clientes?', 1, 3),
(generate_beep_question_uuid('cliente', 4), '7b011ea0-70e3-4ff4-91a8-73acbdf31ee1', 'Você conhece o poder de compra dos seus clientes?', 1, 4),
(generate_beep_question_uuid('cliente', 5), '7b011ea0-70e3-4ff4-91a8-73acbdf31ee1', 'Você identificou diferentes personas de clientes?', 1, 5),
(generate_beep_question_uuid('cliente', 6), '7b011ea0-70e3-4ff4-91a8-73acbdf31ee1', 'Você sabe como seus clientes tomam decisões de compra?', 1, 6),
(generate_beep_question_uuid('cliente', 7), '7b011ea0-70e3-4ff4-91a8-73acbdf31ee1', 'Você conhece o ciclo de vida e jornada do seu cliente?', 1, 7),
(generate_beep_question_uuid('cliente', 8), '7b011ea0-70e3-4ff4-91a8-73acbdf31ee1', 'Você tem canais diretos de comunicação com seus clientes?', 1, 8),
(generate_beep_question_uuid('cliente', 9), '7b011ea0-70e3-4ff4-91a8-73acbdf31ee1', 'Você consegue segmentar seus clientes por diferentes critérios?', 1, 9);

-- Insert questions for "mercado" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('mercado', 0), 'dd37acd2-eaed-4259-94de-569c23bec90e', 'Você conhece o tamanho do mercado que pretende atender?', 1, 0),
(generate_beep_question_uuid('mercado', 1), 'dd37acd2-eaed-4259-94de-569c23bec90e', 'Você identificou seus principais concorrentes diretos e indiretos?', 1, 1),
(generate_beep_question_uuid('mercado', 2), 'dd37acd2-eaed-4259-94de-569c23bec90e', 'Você entende as tendências e direcionamentos do seu mercado?', 1, 2),
(generate_beep_question_uuid('mercado', 3), 'dd37acd2-eaed-4259-94de-569c23bec90e', 'Você conhece as barreiras de entrada do seu mercado?', 1, 3),
(generate_beep_question_uuid('mercado', 4), 'dd37acd2-eaed-4259-94de-569c23bec90e', 'Você identificou oportunidades de crescimento no mercado?', 1, 4),
(generate_beep_question_uuid('mercado', 5), 'dd37acd2-eaed-4259-94de-569c23bec90e', 'Você compreende a regulamentação que afeta seu mercado?', 1, 5),
(generate_beep_question_uuid('mercado', 6), 'dd37acd2-eaed-4259-94de-569c23bec90e', 'Você conhece os canais de distribuição utilizados no seu mercado?', 1, 6),
(generate_beep_question_uuid('mercado', 7), 'dd37acd2-eaed-4259-94de-569c23bec90e', 'Você entende a sazonalidade e ciclos do seu mercado?', 1, 7),
(generate_beep_question_uuid('mercado', 8), 'dd37acd2-eaed-4259-94de-569c23bec90e', 'Você identificou nichos específicos dentro do seu mercado?', 1, 8),
(generate_beep_question_uuid('mercado', 9), 'dd37acd2-eaed-4259-94de-569c23bec90e', 'Você acompanha métricas e indicadores do seu mercado?', 1, 9);

-- Insert questions for "solucao" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('solucao', 0), 'a88dc84c-d51b-4655-8ca8-ef8c69dc38a1', 'Sua solução resolve efetivamente o problema identificado?', 1, 0),
(generate_beep_question_uuid('solucao', 1), 'a88dc84c-d51b-4655-8ca8-ef8c69dc38a1', 'Você consegue explicar claramente como sua solução funciona?', 1, 1),
(generate_beep_question_uuid('solucao', 2), 'a88dc84c-d51b-4655-8ca8-ef8c69dc38a1', 'Sua solução oferece vantagens competitivas claras?', 1, 2),
(generate_beep_question_uuid('solucao', 3), 'a88dc84c-d51b-4655-8ca8-ef8c69dc38a1', 'Você validou que os clientes consideram sua solução superior às alternativas?', 1, 3),
(generate_beep_question_uuid('solucao', 4), 'a88dc84c-d51b-4655-8ca8-ef8c69dc38a1', 'Sua solução é escalável para atender um grande número de clientes?', 1, 4),
(generate_beep_question_uuid('solucao', 5), 'a88dc84c-d51b-4655-8ca8-ef8c69dc38a1', 'Você tem um roadmap claro de evolução da sua solução?', 1, 5),
(generate_beep_question_uuid('solucao', 6), 'a88dc84c-d51b-4655-8ca8-ef8c69dc38a1', 'Sua solução é fácil de usar e compreender pelos clientes?', 1, 6),
(generate_beep_question_uuid('solucao', 7), 'a88dc84c-d51b-4655-8ca8-ef8c69dc38a1', 'Você consegue desenvolver e entregar sua solução de forma consistente?', 1, 7),
(generate_beep_question_uuid('solucao', 8), 'a88dc84c-d51b-4655-8ca8-ef8c69dc38a1', 'Você tem mecanismos para coletar feedback sobre sua solução?', 1, 8),
(generate_beep_question_uuid('solucao', 9), 'a88dc84c-d51b-4655-8ca8-ef8c69dc38a1', 'Sua solução pode ser protegida por propriedade intelectual?', 1, 9);

-- Insert questions for "monetizacao" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('monetizacao', 0), 'd113814c-d3f2-4c1c-9e7b-6deb99eb3962', 'Você definiu claramente como irá gerar receita?', 1, 0),
(generate_beep_question_uuid('monetizacao', 1), 'd113814c-d3f2-4c1c-9e7b-6deb99eb3962', 'Você testou e validou seu modelo de precificação?', 1, 1),
(generate_beep_question_uuid('monetizacao', 2), 'd113814c-d3f2-4c1c-9e7b-6deb99eb3962', 'Você entende a disposição de pagamento dos seus clientes?', 1, 2),
(generate_beep_question_uuid('monetizacao', 3), 'd113814c-d3f2-4c1c-9e7b-6deb99eb3962', 'Você tem múltiplas fontes de receita identificadas?', 1, 3),
(generate_beep_question_uuid('monetizacao', 4), 'd113814c-d3f2-4c1c-9e7b-6deb99eb3962', 'Seu modelo de receita é sustentável e recorrente?', 1, 4),
(generate_beep_question_uuid('monetizacao', 5), 'd113814c-d3f2-4c1c-9e7b-6deb99eb3962', 'Você calculou corretamente seus custos de aquisição de cliente?', 1, 5),
(generate_beep_question_uuid('monetizacao', 6), 'd113814c-d3f2-4c1c-9e7b-6deb99eb3962', 'Você conhece o lifetime value (LTV) dos seus clientes?', 1, 6),
(generate_beep_question_uuid('monetizacao', 7), 'd113814c-d3f2-4c1c-9e7b-6deb99eb3962', 'Você tem estratégias para aumentar a receita por cliente?', 1, 7),
(generate_beep_question_uuid('monetizacao', 8), 'd113814c-d3f2-4c1c-9e7b-6deb99eb3962', 'Seu modelo de negócio permite margem de lucro adequada?', 1, 8),
(generate_beep_question_uuid('monetizacao', 9), 'd113814c-d3f2-4c1c-9e7b-6deb99eb3962', 'Você consegue prever e projetar suas receitas futuras?', 1, 9);

-- Insert questions for "tecnologia" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('tecnologia', 0), '9e20667b-5217-425d-9a23-93c58ec402c9', 'Você tem as competências tecnológicas necessárias para desenvolver sua solução?', 1, 0),
(generate_beep_question_uuid('tecnologia', 1), '9e20667b-5217-425d-9a23-93c58ec402c9', 'Sua arquitetura tecnológica é robusta e escalável?', 1, 1),
(generate_beep_question_uuid('tecnologia', 2), '9e20667b-5217-425d-9a23-93c58ec402c9', 'Você considera aspectos de segurança e privacidade na sua solução?', 1, 2),
(generate_beep_question_uuid('tecnologia', 3), '9e20667b-5217-425d-9a23-93c58ec402c9', 'Você tem um plano de desenvolvimento tecnológico estruturado?', 1, 3),
(generate_beep_question_uuid('tecnologia', 4), '9e20667b-5217-425d-9a23-93c58ec402c9', 'Sua solução tecnológica é diferenciada da concorrência?', 1, 4),
(generate_beep_question_uuid('tecnologia', 5), '9e20667b-5217-425d-9a23-93c58ec402c9', 'Você consegue manter e atualizar sua tecnologia continuamente?', 1, 5),
(generate_beep_question_uuid('tecnologia', 6), '9e20667b-5217-425d-9a23-93c58ec402c9', 'Você tem processos de qualidade e testes implementados?', 1, 6),
(generate_beep_question_uuid('tecnologia', 7), '9e20667b-5217-425d-9a23-93c58ec402c9', 'Sua tecnologia permite integração com outros sistemas?', 1, 7),
(generate_beep_question_uuid('tecnologia', 8), '9e20667b-5217-425d-9a23-93c58ec402c9', 'Você considera aspectos de performance e experiência do usuário?', 1, 8),
(generate_beep_question_uuid('tecnologia', 9), '9e20667b-5217-425d-9a23-93c58ec402c9', 'Você tem backup e planos de contingência para sua tecnologia?', 1, 9);

-- Insert questions for "financeiro" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('financeiro', 0), '12319ac4-03d4-49f4-a4b5-ba6ac204dae9', 'Você tem controle detalhado das suas finanças e fluxo de caixa?', 1, 0),
(generate_beep_question_uuid('financeiro', 1), '12319ac4-03d4-49f4-a4b5-ba6ac204dae9', 'Você conhece todos os custos envolvidos no seu negócio?', 1, 1),
(generate_beep_question_uuid('financeiro', 2), '12319ac4-03d4-49f4-a4b5-ba6ac204dae9', 'Você tem projeções financeiras realistas para os próximos anos?', 1, 2),
(generate_beep_question_uuid('financeiro', 3), '12319ac4-03d4-49f4-a4b5-ba6ac204dae9', 'Você identificou e planejou suas necessidades de investimento?', 1, 3),
(generate_beep_question_uuid('financeiro', 4), '12319ac4-03d4-49f4-a4b5-ba6ac204dae9', 'Você tem estratégias para captação de recursos financeiros?', 1, 4),
(generate_beep_question_uuid('financeiro', 5), '12319ac4-03d4-49f4-a4b5-ba6ac204dae9', 'Você monitora regularmente indicadores financeiros chave?', 1, 5),
(generate_beep_question_uuid('financeiro', 6), '12319ac4-03d4-49f4-a4b5-ba6ac204dae9', 'Você tem reservas financeiras para situações imprevistas?', 1, 6),
(generate_beep_question_uuid('financeiro', 7), '12319ac4-03d4-49f4-a4b5-ba6ac204dae9', 'Você entende e calcula corretamente a rentabilidade do negócio?', 1, 7),
(generate_beep_question_uuid('financeiro', 8), '12319ac4-03d4-49f4-a4b5-ba6ac204dae9', 'Você tem processos de cobrança e gestão de recebíveis?', 1, 8),
(generate_beep_question_uuid('financeiro', 9), '12319ac4-03d4-49f4-a4b5-ba6ac204dae9', 'Você conhece as obrigações fiscais e tributárias do seu negócio?', 1, 9);

-- Insert questions for "gente" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('gente', 0), '126437d4-48b7-45f5-a4ca-4420605a9468', 'Você tem uma equipe com as competências necessárias para o negócio?', 1, 0),
(generate_beep_question_uuid('gente', 1), '126437d4-48b7-45f5-a4ca-4420605a9468', 'Você definiu claramente os papéis e responsabilidades da equipe?', 1, 1),
(generate_beep_question_uuid('gente', 2), '126437d4-48b7-45f5-a4ca-4420605a9468', 'Você tem processos de recrutamento e seleção estruturados?', 1, 2),
(generate_beep_question_uuid('gente', 3), '126437d4-48b7-45f5-a4ca-4420605a9468', 'Você oferece treinamento e desenvolvimento para sua equipe?', 1, 3),
(generate_beep_question_uuid('gente', 4), '126437d4-48b7-45f5-a4ca-4420605a9468', 'Você tem estratégias de retenção e motivação da equipe?', 1, 4),
(generate_beep_question_uuid('gente', 5), '126437d4-48b7-45f5-a4ca-4420605a9468', 'Você consegue avaliar o desempenho da equipe objetivamente?', 1, 5),
(generate_beep_question_uuid('gente', 6), '126437d4-48b7-45f5-a4ca-4420605a9468', 'Você tem planos de crescimento e sucessão para posições chave?', 1, 6),
(generate_beep_question_uuid('gente', 7), '126437d4-48b7-45f5-a4ca-4420605a9468', 'Você promove uma cultura organizacional positiva?', 1, 7),
(generate_beep_question_uuid('gente', 8), '126437d4-48b7-45f5-a4ca-4420605a9468', 'Você tem canais de comunicação eficazes com a equipe?', 1, 8),
(generate_beep_question_uuid('gente', 9), '126437d4-48b7-45f5-a4ca-4420605a9468', 'Você consegue delegar responsabilidades adequadamente?', 1, 9);

-- Insert questions for "gestao" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('gestao', 0), '437a7e8b-844c-4843-8cea-a6fd1227368d', 'Você tem objetivos e metas claras para o negócio?', 1, 0),
(generate_beep_question_uuid('gestao', 1), '437a7e8b-844c-4843-8cea-a6fd1227368d', 'Você monitora regularmente o progresso em direção aos objetivos?', 1, 1),
(generate_beep_question_uuid('gestao', 2), '437a7e8b-844c-4843-8cea-a6fd1227368d', 'Você tem processos de tomada de decisão estruturados?', 1, 2),
(generate_beep_question_uuid('gestao', 3), '437a7e8b-844c-4843-8cea-a6fd1227368d', 'Você consegue priorizar atividades e focar no que é mais importante?', 1, 3),
(generate_beep_question_uuid('gestao', 4), '437a7e8b-844c-4843-8cea-a6fd1227368d', 'Você tem sistemas de informação adequados para gestão do negócio?', 1, 4),
(generate_beep_question_uuid('gestao', 5), '437a7e8b-844c-4843-8cea-a6fd1227368d', 'Você realiza reuniões produtivas e alinhamento regular com a equipe?', 1, 5),
(generate_beep_question_uuid('gestao', 6), '437a7e8b-844c-4843-8cea-a6fd1227368d', 'Você tem processos de planejamento estratégico implementados?', 1, 6),
(generate_beep_question_uuid('gestao', 7), '437a7e8b-844c-4843-8cea-a6fd1227368d', 'Você consegue identificar e mitigar riscos do negócio?', 1, 7),
(generate_beep_question_uuid('gestao', 8), '437a7e8b-844c-4843-8cea-a6fd1227368d', 'Você tem mecanismos de controle de qualidade nos processos?', 1, 8),
(generate_beep_question_uuid('gestao', 9), '437a7e8b-844c-4843-8cea-a6fd1227368d', 'Você documenta e padroniza os principais processos do negócio?', 1, 9);

-- Insert questions for "processos" subcategory
INSERT INTO beep_questions (id, subcategory_id, question_text, weight, order_index) VALUES
(generate_beep_question_uuid('processos', 0), '7587d48c-5ab9-4e6d-a50d-7e322921740c', 'Você tem processos operacionais bem definidos e documentados?', 1, 0),
(generate_beep_question_uuid('processos', 1), '7587d48c-5ab9-4e6d-a50d-7e322921740c', 'Você consegue entregar seus produtos/serviços de forma consistente?', 1, 1),
(generate_beep_question_uuid('processos', 2), '7587d48c-5ab9-4e6d-a50d-7e322921740c', 'Você tem processos de atendimento ao cliente estruturados?', 1, 2),
(generate_beep_question_uuid('processos', 3), '7587d48c-5ab9-4e6d-a50d-7e322921740c', 'Você monitora e melhora continuamente seus processos?', 1, 3),
(generate_beep_question_uuid('processos', 4), '7587d48c-5ab9-4e6d-a50d-7e322921740c', 'Você tem processos de vendas e marketing organizados?', 1, 4),
(generate_beep_question_uuid('processos', 5), '7587d48c-5ab9-4e6d-a50d-7e322921740c', 'Você consegue escalar seus processos conforme o crescimento?', 1, 5),
(generate_beep_question_uuid('processos', 6), '7587d48c-5ab9-4e6d-a50d-7e322921740c', 'Você tem processos de controle de estoque e suprimentos?', 1, 6),
(generate_beep_question_uuid('processos', 7), '7587d48c-5ab9-4e6d-a50d-7e322921740c', 'Você utiliza tecnologia para automatizar processos repetitivos?', 1, 7),
(generate_beep_question_uuid('processos', 8), '7587d48c-5ab9-4e6d-a50d-7e322921740c', 'Você tem processos de feedback e melhoria contínua?', 1, 8),
(generate_beep_question_uuid('processos', 9), '7587d48c-5ab9-4e6d-a50d-7e322921740c', 'Você consegue medir a eficiência dos seus processos?', 1, 9);

-- Drop the helper function after use
DROP FUNCTION generate_beep_question_uuid(TEXT, INTEGER);