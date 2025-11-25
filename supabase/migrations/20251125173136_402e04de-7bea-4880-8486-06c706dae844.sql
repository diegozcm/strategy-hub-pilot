-- ============================================
-- FASE 1: Adicionar campos de Quarter e Dono do KR
-- ============================================

-- Adicionar campos de vigência (Quarter) na tabela key_results
ALTER TABLE key_results
ADD COLUMN start_month VARCHAR(7),      -- formato "2024-01"
ADD COLUMN end_month VARCHAR(7);        -- formato "2024-12"

-- Adicionar campo de dono do KR (FK para profiles)
ALTER TABLE key_results
ADD COLUMN assigned_owner_id UUID REFERENCES profiles(user_id);

-- Índices para busca eficiente
CREATE INDEX idx_key_results_assigned_owner ON key_results(assigned_owner_id);
CREATE INDEX idx_key_results_period ON key_results(start_month, end_month);

-- Comentários para documentação
COMMENT ON COLUMN key_results.start_month IS 'Mês de início da vigência do KR (formato YYYY-MM)';
COMMENT ON COLUMN key_results.end_month IS 'Mês de fim da vigência do KR (formato YYYY-MM)';
COMMENT ON COLUMN key_results.assigned_owner_id IS 'Dono/responsável do KR - deve ser usuário da empresa';

-- ============================================
-- FASE 2: Trigger para validar que o dono pertence à empresa
-- ============================================

-- Função para validar que o dono do KR pertence à empresa do KR
CREATE OR REPLACE FUNCTION validate_kr_owner_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Se assigned_owner_id for nulo, não precisa validar
  IF NEW.assigned_owner_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se o usuário tem relação com a empresa do KR
  IF NOT EXISTS (
    SELECT 1 
    FROM user_company_relations ucr
    JOIN strategic_objectives so ON so.id = NEW.objective_id
    JOIN strategic_plans sp ON sp.id = so.plan_id
    WHERE ucr.user_id = NEW.assigned_owner_id
    AND ucr.company_id = sp.company_id
  ) THEN
    RAISE EXCEPTION 'O dono do KR deve ser um usuário relacionado à empresa';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER trigger_validate_kr_owner
BEFORE INSERT OR UPDATE ON key_results
FOR EACH ROW
EXECUTE FUNCTION validate_kr_owner_company();