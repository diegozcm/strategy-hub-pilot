-- Alterar o default da coluna weight de 50 para 1
ALTER TABLE strategic_objectives ALTER COLUMN weight SET DEFAULT 1;

-- Atualizar objetivos existentes: peso 50 → 5 (meio da escala 1-10)
UPDATE strategic_objectives SET weight = 5 WHERE weight = 50;

-- Corrigir qualquer valor fora da escala (>10) → 10
UPDATE strategic_objectives SET weight = 10 WHERE weight > 10;

-- Corrigir qualquer valor abaixo de 1 → 1
UPDATE strategic_objectives SET weight = 1 WHERE weight < 1 OR weight IS NULL;