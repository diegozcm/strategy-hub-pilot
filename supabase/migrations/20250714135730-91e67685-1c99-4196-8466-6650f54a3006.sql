-- Primeiro, vamos adicionar as colunas que estão nos indicadores mas não nos KRs
ALTER TABLE key_results 
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();

-- Migrar dados da tabela indicators para key_results, mapeando o status corretamente
INSERT INTO key_results (
  objective_id,
  title,
  description,
  target_value,
  current_value,
  unit,
  frequency,
  owner_id,
  status,
  category,
  priority,
  last_updated,
  created_at,
  updated_at
)
SELECT 
  strategic_objective_id,
  name,
  description,
  target_value,
  current_value,
  unit,
  measurement_frequency,
  owner_id,
  CASE 
    WHEN status = 'active' THEN 'in_progress'
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'paused' THEN 'suspended'
    ELSE 'not_started'
  END,
  category,
  priority,
  last_updated,
  created_at,
  updated_at
FROM indicators
WHERE strategic_objective_id IS NOT NULL;

-- Criar uma nova tabela para valores históricos dos KRs (baseada em indicator_values)
CREATE TABLE IF NOT EXISTS key_result_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID REFERENCES key_results(id) ON DELETE CASCADE,
  value DECIMAL(15,2) NOT NULL,
  period_date DATE NOT NULL,
  comments TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migrar dados de indicator_values para key_result_values
INSERT INTO key_result_values (key_result_id, value, period_date, comments, recorded_by, created_at)
SELECT 
  kr.id,
  iv.value,
  iv.period_date,
  iv.comments,
  iv.recorded_by,
  iv.created_at
FROM indicator_values iv
JOIN indicators i ON iv.indicator_id = i.id
JOIN key_results kr ON kr.title = i.name AND kr.objective_id = i.strategic_objective_id
WHERE i.strategic_objective_id IS NOT NULL;

-- Habilitar RLS na nova tabela
ALTER TABLE key_result_values ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para key_result_values
CREATE POLICY "Users can view key result values" 
ON key_result_values 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create key result values" 
ON key_result_values 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update key result values" 
ON key_result_values 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete key result values" 
ON key_result_values 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Criar índices para performance
CREATE INDEX idx_key_result_values_key_result_id ON key_result_values(key_result_id);
CREATE INDEX idx_key_result_values_period_date ON key_result_values(period_date);
CREATE INDEX idx_key_results_category ON key_results(category);
CREATE INDEX idx_key_results_priority ON key_results(priority);

-- Remover as tabelas antigas
DROP TABLE IF EXISTS indicator_values CASCADE;
DROP TABLE IF EXISTS indicators CASCADE;