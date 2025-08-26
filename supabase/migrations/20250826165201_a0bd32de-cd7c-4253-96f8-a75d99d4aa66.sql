
-- Create BEEP assessment system tables

-- Enum for maturity levels
CREATE TYPE beep_maturity_level AS ENUM (
  'idealizando',
  'validando_problemas_solucoes', 
  'iniciando_negocio',
  'validando_mercado',
  'evoluindo'
);

-- Categories table (4 main categories)
CREATE TABLE beep_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subcategories table (10 subcategories)
CREATE TABLE beep_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES beep_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Questions table (100 questions)
CREATE TABLE beep_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES beep_subcategories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Maturity levels definition
CREATE TABLE beep_maturity_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level beep_maturity_level NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  min_score DECIMAL(3,2) NOT NULL,
  max_score DECIMAL(3,2) NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessments table (each startup assessment)
CREATE TABLE beep_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_name VARCHAR(200),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  final_score DECIMAL(3,2),
  maturity_level beep_maturity_level,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Answers table (individual answers to questions)
CREATE TABLE beep_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES beep_assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES beep_questions(id) ON DELETE CASCADE,
  answer_value INTEGER NOT NULL CHECK (answer_value >= 1 AND answer_value <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(assessment_id, question_id)
);

-- Enable RLS on all tables
ALTER TABLE beep_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE beep_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE beep_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE beep_maturity_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE beep_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE beep_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories, subcategories, questions, and maturity levels - readable by users with startup-hub access
CREATE POLICY "Users with startup-hub access can view categories" 
ON beep_categories FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_modules um 
    JOIN system_modules sm ON sm.id = um.module_id 
    WHERE um.user_id = auth.uid() 
    AND um.active = true 
    AND sm.slug = 'startup-hub'
  )
);

CREATE POLICY "Users with startup-hub access can view subcategories" 
ON beep_subcategories FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_modules um 
    JOIN system_modules sm ON sm.id = um.module_id 
    WHERE um.user_id = auth.uid() 
    AND um.active = true 
    AND sm.slug = 'startup-hub'
  )
);

CREATE POLICY "Users with startup-hub access can view questions" 
ON beep_questions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_modules um 
    JOIN system_modules sm ON sm.id = um.module_id 
    WHERE um.user_id = auth.uid() 
    AND um.active = true 
    AND sm.slug = 'startup-hub'
  )
);

CREATE POLICY "Users with startup-hub access can view maturity levels" 
ON beep_maturity_levels FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_modules um 
    JOIN system_modules sm ON sm.id = um.module_id 
    WHERE um.user_id = auth.uid() 
    AND um.active = true 
    AND sm.slug = 'startup-hub'
  )
);

-- Assessments - startup users can manage their own, mentors can view all
CREATE POLICY "Startup users can manage their own assessments" 
ON beep_assessments FOR ALL 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM startup_hub_profiles shp 
    WHERE shp.user_id = auth.uid() 
    AND shp.type = 'startup'
    AND shp.status = 'active'
  )
);

CREATE POLICY "Mentors can view all assessments" 
ON beep_assessments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM startup_hub_profiles shp 
    WHERE shp.user_id = auth.uid() 
    AND shp.type = 'mentor'
    AND shp.status = 'active'
  )
);

-- Answers - users can manage answers for their own assessments
CREATE POLICY "Users can manage answers for their own assessments" 
ON beep_answers FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM beep_assessments ba 
    WHERE ba.id = assessment_id 
    AND ba.user_id = auth.uid()
  )
);

CREATE POLICY "Mentors can view all answers" 
ON beep_answers FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM startup_hub_profiles shp 
    WHERE shp.user_id = auth.uid() 
    AND shp.type = 'mentor'
    AND shp.status = 'active'
  )
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_beep_categories_updated_at BEFORE UPDATE ON beep_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_beep_subcategories_updated_at BEFORE UPDATE ON beep_subcategories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_beep_questions_updated_at BEFORE UPDATE ON beep_questions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_beep_assessments_updated_at BEFORE UPDATE ON beep_assessments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_beep_answers_updated_at BEFORE UPDATE ON beep_answers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert maturity levels
INSERT INTO beep_maturity_levels (level, name, description, min_score, max_score, order_index) VALUES
('idealizando', 'Idealizando', 'Fase inicial de concepção da ideia de negócio', 1.0, 1.8, 1),
('validando_problemas_solucoes', 'Validando Problemas e Soluções', 'Fase de validação do problema e das soluções propostas', 1.9, 2.6, 2),
('iniciando_negocio', 'Iniciando o Negócio', 'Fase de estruturação e início das operações', 2.7, 3.4, 3),
('validando_mercado', 'Validando o Mercado', 'Fase de validação do mercado e modelo de negócio', 3.5, 4.2, 4),
('evoluindo', 'Evoluindo', 'Fase de crescimento e expansão do negócio', 4.3, 5.0, 5);

-- Insert categories
INSERT INTO beep_categories (name, slug, description, order_index) VALUES
('Modelo de Negócio', 'modelo-negocio', 'Avaliação do modelo de negócio da startup', 1),
('Produto', 'produto', 'Avaliação do produto ou serviço oferecido', 2),
('Operação', 'operacao', 'Avaliação dos aspectos operacionais do negócio', 3);

-- Insert subcategories
INSERT INTO beep_subcategories (category_id, name, slug, description, order_index) VALUES
-- Modelo de Negócio
((SELECT id FROM beep_categories WHERE slug = 'modelo-negocio'), 'Problema', 'problema', 'Avaliação da identificação e validação do problema', 1),
((SELECT id FROM beep_categories WHERE slug = 'modelo-negocio'), 'Validação', 'validacao', 'Avaliação do processo de validação do negócio', 2),
((SELECT id FROM beep_categories WHERE slug = 'modelo-negocio'), 'Cliente', 'cliente', 'Avaliação do conhecimento sobre o cliente', 3),
((SELECT id FROM beep_categories WHERE slug = 'modelo-negocio'), 'Mercado', 'mercado', 'Avaliação do conhecimento sobre o mercado', 4),
-- Produto
((SELECT id FROM beep_categories WHERE slug = 'produto'), 'Solução', 'solucao', 'Avaliação da solução oferecida', 1),
((SELECT id FROM beep_categories WHERE slug = 'produto'), 'Modelo de Negócio (Monetização)', 'monetizacao', 'Avaliação do modelo de monetização', 2),
((SELECT id FROM beep_categories WHERE slug = 'produto'), 'Tecnologia', 'tecnologia', 'Avaliação dos aspectos tecnológicos', 3),
-- Operação
((SELECT id FROM beep_categories WHERE slug = 'operacao'), 'Financeiro', 'financeiro', 'Avaliação dos aspectos financeiros', 1),
((SELECT id FROM beep_categories WHERE slug = 'operacao'), 'Gente', 'gente', 'Avaliação da equipe e recursos humanos', 2),
((SELECT id FROM beep_categories WHERE slug = 'operacao'), 'Gestão', 'gestao', 'Avaliação dos processos de gestão', 3),
((SELECT id FROM beep_categories WHERE slug = 'operacao'), 'Processos', 'processos', 'Avaliação dos processos operacionais', 4);
