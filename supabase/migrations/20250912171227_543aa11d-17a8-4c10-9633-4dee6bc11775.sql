-- Criar tabela para ações mensais dos KRs
CREATE TABLE public.kr_monthly_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key_result_id uuid NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- Formato: "2024-01", "2024-02"
  action_title VARCHAR(255) NOT NULL,
  action_description TEXT,
  planned_value NUMERIC(15,2),
  actual_value NUMERIC(15,2),
  completion_percentage NUMERIC(5,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  responsible VARCHAR(255),
  start_date DATE,
  end_date DATE,
  evidence_links TEXT[], -- Links para evidências/documentos
  notes TEXT,
  created_by uuid NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(key_result_id, month_year, action_title),
  CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  CHECK (priority IN ('low', 'medium', 'high'))
);

-- Criar tabela de histórico de ações
CREATE TABLE public.kr_actions_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id uuid NOT NULL REFERENCES kr_monthly_actions(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_type VARCHAR(50) NOT NULL, -- created, updated, status_changed, completed
  previous_data JSONB,
  new_data JSONB,
  change_reason TEXT
);

-- Habilitar RLS
ALTER TABLE public.kr_monthly_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kr_actions_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para kr_monthly_actions
CREATE POLICY "Users can view actions for company KRs" 
ON public.kr_monthly_actions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_company_relations ucr
  JOIN strategic_plans sp ON sp.id = (
    SELECT so.plan_id FROM strategic_objectives so 
    WHERE so.id = (
      SELECT kr.objective_id FROM key_results kr 
      WHERE kr.id = kr_monthly_actions.key_result_id
    )
  )
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
));

CREATE POLICY "Users can create actions for company KRs" 
ON public.kr_monthly_actions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM user_company_relations ucr
  JOIN strategic_plans sp ON sp.id = (
    SELECT so.plan_id FROM strategic_objectives so 
    WHERE so.id = (
      SELECT kr.objective_id FROM key_results kr 
      WHERE kr.id = kr_monthly_actions.key_result_id
    )
  )
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
) AND created_by = auth.uid());

CREATE POLICY "Users can update actions for company KRs" 
ON public.kr_monthly_actions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM user_company_relations ucr
  JOIN strategic_plans sp ON sp.id = (
    SELECT so.plan_id FROM strategic_objectives so 
    WHERE so.id = (
      SELECT kr.objective_id FROM key_results kr 
      WHERE kr.id = kr_monthly_actions.key_result_id
    )
  )
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = sp.company_id
));

CREATE POLICY "Users can delete their own actions" 
ON public.kr_monthly_actions 
FOR DELETE 
USING (created_by = auth.uid());

-- Políticas RLS para kr_actions_history
CREATE POLICY "Users can view actions history for company KRs" 
ON public.kr_actions_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM kr_monthly_actions kma
  JOIN user_company_relations ucr ON ucr.user_id = auth.uid()
  JOIN strategic_plans sp ON sp.id = (
    SELECT so.plan_id FROM strategic_objectives so 
    WHERE so.id = (
      SELECT kr.objective_id FROM key_results kr 
      WHERE kr.id = kma.key_result_id
    )
  )
  WHERE kma.id = kr_actions_history.action_id AND ucr.company_id = sp.company_id
));

CREATE POLICY "System can create history records" 
ON public.kr_actions_history 
FOR INSERT 
WITH CHECK (changed_by = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_kr_monthly_actions_updated_at
    BEFORE UPDATE ON public.kr_monthly_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar histórico de mudanças
CREATE OR REPLACE FUNCTION create_kr_action_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.kr_actions_history (
    action_id,
    changed_by,
    change_type,
    previous_data,
    new_data,
    change_reason
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'status_changed'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      ELSE TG_OP::text
    END,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    NULL
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kr_monthly_actions_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.kr_monthly_actions
    FOR EACH ROW
    EXECUTE FUNCTION create_kr_action_history();