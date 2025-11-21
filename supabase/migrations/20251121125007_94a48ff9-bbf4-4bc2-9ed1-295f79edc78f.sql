-- =============================================
-- MÓDULO OKR EXECUTION - IMPLEMENTAÇÃO COMPLETA
-- =============================================

-- 1. ADICIONAR CAMPO okr_enabled NA TABELA companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS okr_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.companies.okr_enabled IS 'Habilita o módulo de OKR Execution para esta empresa';

-- 2. CRIAR TABELA okr_years
CREATE TABLE IF NOT EXISTS public.okr_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  is_locked BOOLEAN DEFAULT FALSE,
  overall_progress_percentage NUMERIC(5,2) DEFAULT 0.00,
  total_objectives INTEGER DEFAULT 0,
  completed_objectives INTEGER DEFAULT 0,
  total_key_results INTEGER DEFAULT 0,
  completed_key_results INTEGER DEFAULT 0,
  total_initiatives INTEGER DEFAULT 0,
  completed_initiatives INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, year)
);

COMMENT ON TABLE public.okr_years IS 'Anos de planejamento OKR por empresa';

CREATE INDEX idx_okr_years_company ON public.okr_years(company_id);
CREATE INDEX idx_okr_years_status ON public.okr_years(status);
CREATE INDEX idx_okr_years_year ON public.okr_years(year);

-- 3. CRIAR TABELA okr_periods (trimestres)
CREATE TABLE IF NOT EXISTS public.okr_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_year_id UUID NOT NULL REFERENCES public.okr_years(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  is_locked BOOLEAN DEFAULT FALSE,
  overall_progress_percentage NUMERIC(5,2) DEFAULT 0.00,
  total_objectives INTEGER DEFAULT 0,
  completed_objectives INTEGER DEFAULT 0,
  total_key_results INTEGER DEFAULT 0,
  completed_key_results INTEGER DEFAULT 0,
  total_initiatives INTEGER DEFAULT 0,
  completed_initiatives INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(okr_year_id, quarter)
);

COMMENT ON TABLE public.okr_periods IS 'Trimestres (Q1-Q4) dentro de cada ano OKR';

CREATE INDEX idx_okr_periods_year ON public.okr_periods(okr_year_id);
CREATE INDEX idx_okr_periods_company ON public.okr_periods(company_id);
CREATE INDEX idx_okr_periods_status ON public.okr_periods(status);

-- 4. CRIAR TABELA okr_objectives
CREATE TABLE IF NOT EXISTS public.okr_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_period_id UUID NOT NULL REFERENCES public.okr_periods(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'on_hold')),
  progress_percentage NUMERIC(5,2) DEFAULT 0.00,
  total_key_results INTEGER DEFAULT 0,
  completed_key_results INTEGER DEFAULT 0,
  strategic_objective_id UUID REFERENCES public.strategic_objectives(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.okr_objectives IS 'Objetivos OKR por trimestre';
COMMENT ON COLUMN public.okr_objectives.strategic_objective_id IS 'Link opcional com objetivo do Strategic Planning';

CREATE INDEX idx_okr_objectives_period ON public.okr_objectives(okr_period_id);
CREATE INDEX idx_okr_objectives_company ON public.okr_objectives(company_id);
CREATE INDEX idx_okr_objectives_status ON public.okr_objectives(status);
CREATE INDEX idx_okr_objectives_strategic ON public.okr_objectives(strategic_objective_id);

-- 5. CRIAR TABELA okr_key_results
CREATE TABLE IF NOT EXISTS public.okr_key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_objective_id UUID NOT NULL REFERENCES public.okr_objectives(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'number',
  target_direction VARCHAR(20) DEFAULT 'maximize' CHECK (target_direction IN ('maximize', 'minimize')),
  progress_percentage NUMERIC(5,2) DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'at_risk', 'off_track')),
  responsible VARCHAR(255),
  total_initiatives INTEGER DEFAULT 0,
  completed_initiatives INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.okr_key_results IS 'Key Results (KRs) vinculados a objetivos OKR';

CREATE INDEX idx_okr_key_results_objective ON public.okr_key_results(okr_objective_id);
CREATE INDEX idx_okr_key_results_company ON public.okr_key_results(company_id);
CREATE INDEX idx_okr_key_results_status ON public.okr_key_results(status);

-- 6. CRIAR TABELA okr_initiatives
CREATE TABLE IF NOT EXISTS public.okr_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_key_result_id UUID NOT NULL REFERENCES public.okr_key_results(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  responsible VARCHAR(255),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_in_backlog BOOLEAN DEFAULT TRUE,
  allocated_quarter VARCHAR(2) CHECK (allocated_quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  evidence_links TEXT[],
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.okr_initiatives IS 'Iniciativas (tarefas) vinculadas a Key Results';
COMMENT ON COLUMN public.okr_initiatives.is_in_backlog IS 'TRUE = no backlog anual, FALSE = alocada em trimestre';
COMMENT ON COLUMN public.okr_initiatives.allocated_quarter IS 'Trimestre alocado (Q1-Q4) quando sair do backlog';

CREATE INDEX idx_okr_initiatives_kr ON public.okr_initiatives(okr_key_result_id);
CREATE INDEX idx_okr_initiatives_company ON public.okr_initiatives(company_id);
CREATE INDEX idx_okr_initiatives_status ON public.okr_initiatives(status);
CREATE INDEX idx_okr_initiatives_backlog ON public.okr_initiatives(is_in_backlog);
CREATE INDEX idx_okr_initiatives_quarter ON public.okr_initiatives(allocated_quarter);

-- 7. CRIAR TABELA okr_year_transitions (histórico de transições)
CREATE TABLE IF NOT EXISTS public.okr_year_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  from_year_id UUID NOT NULL REFERENCES public.okr_years(id) ON DELETE CASCADE,
  to_year_id UUID NOT NULL REFERENCES public.okr_years(id) ON DELETE CASCADE,
  transition_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transition_type VARCHAR(20) NOT NULL CHECK (transition_type IN ('automatic', 'manual')),
  performed_by UUID NOT NULL,
  notes TEXT,
  objectives_carried_over INTEGER DEFAULT 0,
  objectives_completed INTEGER DEFAULT 0,
  objectives_cancelled INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.okr_year_transitions IS 'Histórico de transições entre anos OKR';

CREATE INDEX idx_okr_transitions_company ON public.okr_year_transitions(company_id);
CREATE INDEX idx_okr_transitions_from_year ON public.okr_year_transitions(from_year_id);
CREATE INDEX idx_okr_transitions_to_year ON public.okr_year_transitions(to_year_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.okr_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okr_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okr_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okr_key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okr_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okr_year_transitions ENABLE ROW LEVEL SECURITY;

-- POLICIES para okr_years
CREATE POLICY "Users can view company OKR years"
  ON public.okr_years FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() AND ucr.company_id = okr_years.company_id
    )
  );

CREATE POLICY "Admins and managers can create OKR years"
  ON public.okr_years FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_years.company_id
        AND ucr.role IN ('admin', 'manager')
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Admins and managers can update OKR years"
  ON public.okr_years FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_years.company_id
        AND ucr.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins can delete OKR years"
  ON public.okr_years FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_years.company_id
        AND ucr.role = 'admin'
    )
  );

-- POLICIES para okr_periods
CREATE POLICY "Users can view company OKR periods"
  ON public.okr_periods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() AND ucr.company_id = okr_periods.company_id
    )
  );

CREATE POLICY "Admins and managers can create OKR periods"
  ON public.okr_periods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_periods.company_id
        AND ucr.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update OKR periods"
  ON public.okr_periods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_periods.company_id
        AND ucr.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins can delete OKR periods"
  ON public.okr_periods FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_periods.company_id
        AND ucr.role = 'admin'
    )
  );

-- POLICIES para okr_objectives
CREATE POLICY "Users can view company OKR objectives"
  ON public.okr_objectives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() AND ucr.company_id = okr_objectives.company_id
    )
  );

CREATE POLICY "Users can create OKR objectives in active periods"
  ON public.okr_objectives FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      JOIN public.okr_periods op ON op.id = okr_objectives.okr_period_id
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_objectives.company_id
        AND op.status = 'active'
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Users can update OKR objectives in active periods"
  ON public.okr_objectives FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      JOIN public.okr_periods op ON op.id = okr_objectives.okr_period_id
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_objectives.company_id
        AND (op.status = 'active' OR ucr.role IN ('admin', 'manager'))
    )
  );

CREATE POLICY "Admins and managers can delete OKR objectives"
  ON public.okr_objectives FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_objectives.company_id
        AND ucr.role IN ('admin', 'manager')
    )
  );

-- POLICIES para okr_key_results
CREATE POLICY "Users can view company OKR key results"
  ON public.okr_key_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() AND ucr.company_id = okr_key_results.company_id
    )
  );

CREATE POLICY "Users can create OKR key results"
  ON public.okr_key_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_key_results.company_id
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Users can update OKR key results"
  ON public.okr_key_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_key_results.company_id
    )
  );

CREATE POLICY "Admins and managers can delete OKR key results"
  ON public.okr_key_results FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_key_results.company_id
        AND ucr.role IN ('admin', 'manager')
    )
  );

-- POLICIES para okr_initiatives
CREATE POLICY "Users can view company OKR initiatives"
  ON public.okr_initiatives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() AND ucr.company_id = okr_initiatives.company_id
    )
  );

CREATE POLICY "Users can create OKR initiatives"
  ON public.okr_initiatives FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_initiatives.company_id
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Users can update OKR initiatives"
  ON public.okr_initiatives FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_initiatives.company_id
    )
  );

CREATE POLICY "Users can delete their own OKR initiatives"
  ON public.okr_initiatives FOR DELETE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_initiatives.company_id
        AND ucr.role IN ('admin', 'manager')
    )
  );

-- POLICIES para okr_year_transitions
CREATE POLICY "Users can view company OKR transitions"
  ON public.okr_year_transitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() AND ucr.company_id = okr_year_transitions.company_id
    )
  );

CREATE POLICY "Only admins can create OKR transitions"
  ON public.okr_year_transitions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
        AND ucr.company_id = okr_year_transitions.company_id
        AND ucr.role = 'admin'
    )
    AND auth.uid() = performed_by
  );

-- =============================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_okr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at
CREATE TRIGGER update_okr_years_updated_at
  BEFORE UPDATE ON public.okr_years
  FOR EACH ROW EXECUTE FUNCTION public.update_okr_updated_at();

CREATE TRIGGER update_okr_periods_updated_at
  BEFORE UPDATE ON public.okr_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_okr_updated_at();

CREATE TRIGGER update_okr_objectives_updated_at
  BEFORE UPDATE ON public.okr_objectives
  FOR EACH ROW EXECUTE FUNCTION public.update_okr_updated_at();

CREATE TRIGGER update_okr_key_results_updated_at
  BEFORE UPDATE ON public.okr_key_results
  FOR EACH ROW EXECUTE FUNCTION public.update_okr_updated_at();

CREATE TRIGGER update_okr_initiatives_updated_at
  BEFORE UPDATE ON public.okr_initiatives
  FOR EACH ROW EXECUTE FUNCTION public.update_okr_updated_at();

-- Função para recalcular progresso de Key Result baseado em iniciativas
CREATE OR REPLACE FUNCTION public.recalculate_kr_progress()
RETURNS TRIGGER AS $$
DECLARE
  kr_id UUID;
  total_inits INTEGER;
  completed_inits INTEGER;
  new_progress NUMERIC;
BEGIN
  -- Determinar o KR ID (funciona para INSERT, UPDATE, DELETE)
  IF TG_OP = 'DELETE' THEN
    kr_id := OLD.okr_key_result_id;
  ELSE
    kr_id := NEW.okr_key_result_id;
  END IF;

  -- Contar iniciativas
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_inits, completed_inits
  FROM public.okr_initiatives
  WHERE okr_key_result_id = kr_id;

  -- Calcular progresso
  IF total_inits > 0 THEN
    new_progress := (completed_inits::NUMERIC / total_inits::NUMERIC) * 100;
  ELSE
    new_progress := 0;
  END IF;

  -- Atualizar KR
  UPDATE public.okr_key_results
  SET 
    progress_percentage = new_progress,
    total_initiatives = total_inits,
    completed_initiatives = completed_inits,
    current_value = new_progress, -- simplificado: valor atual = % de progresso
    updated_at = now()
  WHERE id = kr_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para recalcular KR quando iniciativa mudar
CREATE TRIGGER recalculate_kr_on_initiative_change
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.okr_initiatives
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_kr_progress();

-- Função para recalcular progresso de Objetivo baseado em KRs
CREATE OR REPLACE FUNCTION public.recalculate_objective_progress()
RETURNS TRIGGER AS $$
DECLARE
  obj_id UUID;
  total_krs INTEGER;
  completed_krs INTEGER;
  avg_progress NUMERIC;
BEGIN
  -- Determinar o Objetivo ID
  IF TG_OP = 'DELETE' THEN
    obj_id := OLD.okr_objective_id;
  ELSE
    obj_id := NEW.okr_objective_id;
  END IF;

  -- Contar KRs e calcular média de progresso
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    AVG(progress_percentage)
  INTO total_krs, completed_krs, avg_progress
  FROM public.okr_key_results
  WHERE okr_objective_id = obj_id;

  -- Atualizar Objetivo
  UPDATE public.okr_objectives
  SET 
    progress_percentage = COALESCE(avg_progress, 0),
    total_key_results = total_krs,
    completed_key_results = completed_krs,
    updated_at = now()
  WHERE id = obj_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para recalcular Objetivo quando KR mudar
CREATE TRIGGER recalculate_objective_on_kr_change
  AFTER INSERT OR UPDATE OF progress_percentage, status OR DELETE ON public.okr_key_results
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_objective_progress();

-- Função para recalcular estatísticas de Period baseado em Objetivos
CREATE OR REPLACE FUNCTION public.recalculate_period_stats()
RETURNS TRIGGER AS $$
DECLARE
  period_id UUID;
  total_objs INTEGER;
  completed_objs INTEGER;
  avg_progress NUMERIC;
  total_krs INTEGER;
  completed_krs INTEGER;
  total_inits INTEGER;
  completed_inits INTEGER;
BEGIN
  -- Determinar o Period ID
  IF TG_OP = 'DELETE' THEN
    period_id := OLD.okr_period_id;
  ELSE
    period_id := NEW.okr_period_id;
  END IF;

  -- Contar objetivos
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    AVG(progress_percentage)
  INTO total_objs, completed_objs, avg_progress
  FROM public.okr_objectives
  WHERE okr_period_id = period_id;

  -- Contar KRs (agregados)
  SELECT 
    COALESCE(SUM(total_key_results), 0),
    COALESCE(SUM(completed_key_results), 0)
  INTO total_krs, completed_krs
  FROM public.okr_objectives
  WHERE okr_period_id = period_id;

  -- Contar iniciativas (via KRs)
  SELECT 
    COALESCE(SUM(kr.total_initiatives), 0),
    COALESCE(SUM(kr.completed_initiatives), 0)
  INTO total_inits, completed_inits
  FROM public.okr_key_results kr
  JOIN public.okr_objectives obj ON obj.id = kr.okr_objective_id
  WHERE obj.okr_period_id = period_id;

  -- Atualizar Period
  UPDATE public.okr_periods
  SET 
    overall_progress_percentage = COALESCE(avg_progress, 0),
    total_objectives = total_objs,
    completed_objectives = completed_objs,
    total_key_results = total_krs,
    completed_key_results = completed_krs,
    total_initiatives = total_inits,
    completed_initiatives = completed_inits,
    updated_at = now()
  WHERE id = period_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para recalcular Period quando Objetivo mudar
CREATE TRIGGER recalculate_period_on_objective_change
  AFTER INSERT OR UPDATE OF progress_percentage, status, total_key_results, completed_key_results OR DELETE ON public.okr_objectives
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_period_stats();

-- Função para recalcular estatísticas de Year baseado em Periods
CREATE OR REPLACE FUNCTION public.recalculate_year_stats()
RETURNS TRIGGER AS $$
DECLARE
  year_id UUID;
  avg_progress NUMERIC;
  total_objs INTEGER;
  completed_objs INTEGER;
  total_krs INTEGER;
  completed_krs INTEGER;
  total_inits INTEGER;
  completed_inits INTEGER;
BEGIN
  -- Determinar o Year ID
  IF TG_OP = 'DELETE' THEN
    year_id := OLD.okr_year_id;
  ELSE
    year_id := NEW.okr_year_id;
  END IF;

  -- Calcular estatísticas agregadas de todos os trimestres
  SELECT 
    AVG(overall_progress_percentage),
    SUM(total_objectives),
    SUM(completed_objectives),
    SUM(total_key_results),
    SUM(completed_key_results),
    SUM(total_initiatives),
    SUM(completed_initiatives)
  INTO avg_progress, total_objs, completed_objs, total_krs, completed_krs, total_inits, completed_inits
  FROM public.okr_periods
  WHERE okr_year_id = year_id;

  -- Atualizar Year
  UPDATE public.okr_years
  SET 
    overall_progress_percentage = COALESCE(avg_progress, 0),
    total_objectives = COALESCE(total_objs, 0),
    completed_objectives = COALESCE(completed_objs, 0),
    total_key_results = COALESCE(total_krs, 0),
    completed_key_results = COALESCE(completed_krs, 0),
    total_initiatives = COALESCE(total_inits, 0),
    completed_initiatives = COALESCE(completed_inits, 0),
    updated_at = now()
  WHERE id = year_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para recalcular Year quando Period mudar
CREATE TRIGGER recalculate_year_on_period_change
  AFTER INSERT OR UPDATE OF overall_progress_percentage, total_objectives, completed_objectives, total_key_results, completed_key_results, total_initiatives, completed_initiatives OR DELETE ON public.okr_periods
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_year_stats();