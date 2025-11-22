-- FASE 1: REESTRUTURAÇÃO DO BANCO DE DADOS

-- 1.1. Criar tabela okr_pillars
CREATE TABLE okr_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  okr_year_id UUID NOT NULL REFERENCES okr_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sponsor_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50) DEFAULT 'Target',
  order_index INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, okr_year_id, name)
);

CREATE INDEX idx_okr_pillars_company ON okr_pillars(company_id);
CREATE INDEX idx_okr_pillars_year ON okr_pillars(okr_year_id);
CREATE INDEX idx_okr_pillars_sponsor ON okr_pillars(sponsor_id);

-- 1.2. Modificar tabela okr_objectives
ALTER TABLE okr_objectives 
  ADD COLUMN okr_pillar_id UUID REFERENCES okr_pillars(id) ON DELETE CASCADE,
  ADD COLUMN sponsor_id UUID REFERENCES profiles(user_id) ON DELETE RESTRICT;

-- Remover dependência de okr_quarter_id (tornar nullable temporariamente)
ALTER TABLE okr_objectives ALTER COLUMN okr_quarter_id DROP NOT NULL;

CREATE INDEX idx_okr_objectives_pillar ON okr_objectives(okr_pillar_id);
CREATE INDEX idx_okr_objectives_sponsor ON okr_objectives(sponsor_id);

-- 1.3. Modificar tabela okr_key_results
ALTER TABLE okr_key_results
  ADD COLUMN tracking_type VARCHAR(20) NOT NULL DEFAULT 'numeric',
  ADD COLUMN quarter INTEGER,
  ADD COLUMN checklist_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN checklist_completed INTEGER DEFAULT 0,
  ADD COLUMN checklist_total INTEGER DEFAULT 0;

ALTER TABLE okr_key_results
  ADD CONSTRAINT check_quarter_range CHECK (quarter IS NULL OR (quarter >= 1 AND quarter <= 4)),
  ADD CONSTRAINT check_tracking_type CHECK (tracking_type IN ('numeric', 'checklist'));

CREATE INDEX idx_okr_key_results_quarter ON okr_key_results(quarter);
CREATE INDEX idx_okr_key_results_tracking ON okr_key_results(tracking_type);

-- 1.4. Configurar RLS Policies para okr_pillars
ALTER TABLE okr_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pillars from their company" ON okr_pillars
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM user_company_relations WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can create pillars" ON okr_pillars
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_module_roles umr
      JOIN system_modules sm ON umr.module_id = sm.id
      WHERE umr.user_id = auth.uid()
        AND sm.slug = 'okr-planning'
        AND umr.role = 'admin'
        AND umr.active = true
    )
  );

CREATE POLICY "Admins and sponsors can update pillars" ON okr_pillars
  FOR UPDATE USING (
    sponsor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_module_roles umr
      JOIN system_modules sm ON umr.module_id = sm.id
      WHERE umr.user_id = auth.uid()
        AND sm.slug = 'okr-planning'
        AND umr.role = 'admin'
        AND umr.active = true
    )
  );

CREATE POLICY "Admins can delete pillars" ON okr_pillars
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_module_roles umr
      JOIN system_modules sm ON umr.module_id = sm.id
      WHERE umr.user_id = auth.uid()
        AND sm.slug = 'okr-planning'
        AND umr.role = 'admin'
        AND umr.active = true
    )
  );

-- 1.5. Atualizar policies de okr_objectives
DROP POLICY IF EXISTS "Users can update objectives they own" ON okr_objectives;
CREATE POLICY "Users can update objectives they sponsor or own" ON okr_objectives
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    sponsor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_module_roles umr
      JOIN system_modules sm ON umr.module_id = sm.id
      WHERE umr.user_id = auth.uid()
        AND sm.slug = 'okr-planning'
        AND umr.role IN ('admin', 'manager')
        AND umr.active = true
    )
  );

-- 1.6. Trigger para auto-calcular progresso do KR tipo checklist
CREATE OR REPLACE FUNCTION calculate_checklist_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_type = 'checklist' AND NEW.checklist_items IS NOT NULL THEN
    NEW.checklist_total := jsonb_array_length(NEW.checklist_items);
    NEW.checklist_completed := (
      SELECT COUNT(*)
      FROM jsonb_array_elements(NEW.checklist_items) item
      WHERE (item->>'completed')::boolean = true
    );
    
    IF NEW.checklist_total > 0 THEN
      NEW.progress_percentage := ROUND((NEW.checklist_completed::NUMERIC / NEW.checklist_total::NUMERIC) * 100, 2);
    ELSE
      NEW.progress_percentage := 0;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_checklist_progress
  BEFORE INSERT OR UPDATE ON okr_key_results
  FOR EACH ROW
  WHEN (NEW.tracking_type = 'checklist')
  EXECUTE FUNCTION calculate_checklist_progress();

-- 1.7. Trigger para validar deadline de ações dentro do trimestre do KR
CREATE OR REPLACE FUNCTION validate_action_deadline()
RETURNS TRIGGER AS $$
DECLARE
  kr_quarter INTEGER;
  kr_year INTEGER;
  quarter_start DATE;
  quarter_end DATE;
BEGIN
  -- Buscar quarter e year do KR
  SELECT kr.quarter, y.year
  INTO kr_quarter, kr_year
  FROM okr_key_results kr
  JOIN okr_objectives o ON kr.okr_objective_id = o.id
  JOIN okr_pillars p ON o.okr_pillar_id = p.id
  JOIN okr_years y ON p.okr_year_id = y.id
  WHERE kr.id = NEW.okr_key_result_id;
  
  -- Se KR tem quarter definido, validar deadline da ação
  IF kr_quarter IS NOT NULL AND NEW.due_date IS NOT NULL THEN
    -- Calcular datas do trimestre
    quarter_start := make_date(kr_year, (kr_quarter - 1) * 3 + 1, 1);
    quarter_end := (quarter_start + INTERVAL '3 months' - INTERVAL '1 day')::DATE;
    
    IF NEW.due_date < quarter_start OR NEW.due_date > quarter_end THEN
      RAISE EXCEPTION 'A data de conclusão da ação deve estar dentro do trimestre Q% (% a %)', 
        kr_quarter, quarter_start, quarter_end;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_action_deadline
  BEFORE INSERT OR UPDATE ON okr_actions
  FOR EACH ROW
  EXECUTE FUNCTION validate_action_deadline();