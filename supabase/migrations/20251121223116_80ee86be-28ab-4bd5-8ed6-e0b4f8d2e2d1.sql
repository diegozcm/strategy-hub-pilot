-- ================================================
-- OKR PLANNING MODULE - DATA STRUCTURE
-- ================================================

-- ================================================
-- 1. OKR YEARS TABLE
-- ================================================
CREATE TABLE public.okr_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  theme TEXT,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, year)
);

CREATE INDEX idx_okr_years_company ON public.okr_years(company_id);
CREATE INDEX idx_okr_years_status ON public.okr_years(status);

-- Enable RLS
ALTER TABLE public.okr_years ENABLE ROW LEVEL SECURITY;

-- RLS Policies for okr_years
CREATE POLICY "Users can view company OKR years"
  ON public.okr_years FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid() 
      AND ucr.company_id = okr_years.company_id
    )
  );

CREATE POLICY "Admins can create OKR years"
  ON public.okr_years FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_module_roles umr
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE umr.user_id = auth.uid()
      AND umr.role = 'admin'::app_role
      AND umr.active = true
      AND sm.slug = 'okr-planning'
    )
    AND EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid()
      AND ucr.company_id = okr_years.company_id
    )
  );

CREATE POLICY "Admins and managers can update OKR years"
  ON public.okr_years FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_module_roles umr
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE umr.user_id = auth.uid()
      AND umr.role IN ('admin'::app_role, 'manager'::app_role)
      AND umr.active = true
      AND sm.slug = 'okr-planning'
    )
    AND EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid()
      AND ucr.company_id = okr_years.company_id
    )
  );

CREATE POLICY "Admins can delete OKR years"
  ON public.okr_years FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_module_roles umr
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE umr.user_id = auth.uid()
      AND umr.role = 'admin'::app_role
      AND umr.active = true
      AND sm.slug = 'okr-planning'
    )
    AND EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      WHERE ucr.user_id = auth.uid()
      AND ucr.company_id = okr_years.company_id
    )
  );

-- ================================================
-- 2. OKR QUARTERS TABLE
-- ================================================
CREATE TABLE public.okr_quarters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_year_id UUID NOT NULL REFERENCES public.okr_years(id) ON DELETE CASCADE,
  quarter INTEGER NOT NULL CHECK (quarter IN (1, 2, 3, 4)),
  theme TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  progress_percentage NUMERIC(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(okr_year_id, quarter),
  CHECK (end_date > start_date)
);

CREATE INDEX idx_okr_quarters_year ON public.okr_quarters(okr_year_id);
CREATE INDEX idx_okr_quarters_status ON public.okr_quarters(status);

-- Enable RLS
ALTER TABLE public.okr_quarters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for okr_quarters
CREATE POLICY "Users can view company OKR quarters"
  ON public.okr_quarters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_years oy
      JOIN public.user_company_relations ucr ON ucr.company_id = oy.company_id
      WHERE oy.id = okr_quarters.okr_year_id
      AND ucr.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create OKR quarters"
  ON public.okr_quarters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.okr_years oy
      JOIN public.user_module_roles umr ON umr.role = 'admin'::app_role
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE oy.id = okr_quarters.okr_year_id
      AND umr.user_id = auth.uid()
      AND umr.active = true
      AND sm.slug = 'okr-planning'
      AND EXISTS (
        SELECT 1 FROM public.user_company_relations ucr
        WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = oy.company_id
      )
    )
  );

CREATE POLICY "Admins and managers can update OKR quarters"
  ON public.okr_quarters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_years oy
      JOIN public.user_module_roles umr ON umr.role IN ('admin'::app_role, 'manager'::app_role)
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE oy.id = okr_quarters.okr_year_id
      AND umr.user_id = auth.uid()
      AND umr.active = true
      AND sm.slug = 'okr-planning'
      AND EXISTS (
        SELECT 1 FROM public.user_company_relations ucr
        WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = oy.company_id
      )
    )
  );

CREATE POLICY "Admins can delete OKR quarters"
  ON public.okr_quarters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_years oy
      JOIN public.user_module_roles umr ON umr.role = 'admin'::app_role
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE oy.id = okr_quarters.okr_year_id
      AND umr.user_id = auth.uid()
      AND umr.active = true
      AND sm.slug = 'okr-planning'
      AND EXISTS (
        SELECT 1 FROM public.user_company_relations ucr
        WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = oy.company_id
      )
    )
  );

-- ================================================
-- 3. OKR OBJECTIVES TABLE
-- ================================================
CREATE TABLE public.okr_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_quarter_id UUID NOT NULL REFERENCES public.okr_quarters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'on_track', 'at_risk', 'behind', 'completed', 'cancelled')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  progress_percentage NUMERIC(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_okr_objectives_quarter ON public.okr_objectives(okr_quarter_id);
CREATE INDEX idx_okr_objectives_owner ON public.okr_objectives(owner_id);
CREATE INDEX idx_okr_objectives_status ON public.okr_objectives(status);

-- Enable RLS
ALTER TABLE public.okr_objectives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for okr_objectives
CREATE POLICY "Users can view company OKR objectives"
  ON public.okr_objectives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_quarters oq
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_company_relations ucr ON ucr.company_id = oy.company_id
      WHERE oq.id = okr_objectives.okr_quarter_id
      AND ucr.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can create OKR objectives"
  ON public.okr_objectives FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.okr_quarters oq
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_module_roles umr ON umr.role IN ('admin'::app_role, 'manager'::app_role)
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE oq.id = okr_objectives.okr_quarter_id
      AND umr.user_id = auth.uid()
      AND umr.active = true
      AND sm.slug = 'okr-planning'
      AND EXISTS (
        SELECT 1 FROM public.user_company_relations ucr
        WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = oy.company_id
      )
    )
  );

CREATE POLICY "Admins, managers and owners can update OKR objectives"
  ON public.okr_objectives FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.okr_quarters oq
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_module_roles umr ON umr.role IN ('admin'::app_role, 'manager'::app_role)
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE oq.id = okr_objectives.okr_quarter_id
      AND umr.user_id = auth.uid()
      AND umr.active = true
      AND sm.slug = 'okr-planning'
      AND EXISTS (
        SELECT 1 FROM public.user_company_relations ucr
        WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = oy.company_id
      )
    )
  );

CREATE POLICY "Admins can delete OKR objectives"
  ON public.okr_objectives FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_quarters oq
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_module_roles umr ON umr.role = 'admin'::app_role
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE oq.id = okr_objectives.okr_quarter_id
      AND umr.user_id = auth.uid()
      AND umr.active = true
      AND sm.slug = 'okr-planning'
      AND EXISTS (
        SELECT 1 FROM public.user_company_relations ucr
        WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = oy.company_id
      )
    )
  );

-- ================================================
-- 4. OKR KEY RESULTS TABLE
-- ================================================
CREATE TABLE public.okr_key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_objective_id UUID NOT NULL REFERENCES public.okr_objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  metric_type VARCHAR(20) NOT NULL DEFAULT 'number' CHECK (metric_type IN ('number', 'percentage', 'currency', 'boolean')),
  unit TEXT,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  initial_value NUMERIC DEFAULT 0,
  target_direction VARCHAR(20) NOT NULL DEFAULT 'maximize' CHECK (target_direction IN ('maximize', 'minimize')),
  status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'on_track', 'at_risk', 'behind', 'completed', 'cancelled')),
  progress_percentage NUMERIC(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  due_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_okr_key_results_objective ON public.okr_key_results(okr_objective_id);
CREATE INDEX idx_okr_key_results_owner ON public.okr_key_results(owner_id);
CREATE INDEX idx_okr_key_results_status ON public.okr_key_results(status);

-- Enable RLS
ALTER TABLE public.okr_key_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for okr_key_results
CREATE POLICY "Users can view company OKR key results"
  ON public.okr_key_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_objectives oo
      JOIN public.okr_quarters oq ON oq.id = oo.okr_quarter_id
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_company_relations ucr ON ucr.company_id = oy.company_id
      WHERE oo.id = okr_key_results.okr_objective_id
      AND ucr.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins, managers and objective owners can create key results"
  ON public.okr_key_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.okr_objectives oo
      JOIN public.okr_quarters oq ON oq.id = oo.okr_quarter_id
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      WHERE oo.id = okr_key_results.okr_objective_id
      AND (
        oo.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.user_module_roles umr
          JOIN public.system_modules sm ON sm.id = umr.module_id
          WHERE umr.user_id = auth.uid()
          AND umr.role IN ('admin'::app_role, 'manager'::app_role)
          AND umr.active = true
          AND sm.slug = 'okr-planning'
        )
      )
      AND EXISTS (
        SELECT 1 FROM public.user_company_relations ucr
        WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = oy.company_id
      )
    )
  );

CREATE POLICY "Admins, managers and KR owners can update key results"
  ON public.okr_key_results FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.okr_objectives oo
      JOIN public.okr_quarters oq ON oq.id = oo.okr_quarter_id
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      WHERE oo.id = okr_key_results.okr_objective_id
      AND (
        oo.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.user_module_roles umr
          JOIN public.system_modules sm ON sm.id = umr.module_id
          WHERE umr.user_id = auth.uid()
          AND umr.role IN ('admin'::app_role, 'manager'::app_role)
          AND umr.active = true
          AND sm.slug = 'okr-planning'
        )
      )
      AND EXISTS (
        SELECT 1 FROM public.user_company_relations ucr
        WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = oy.company_id
      )
    )
  );

CREATE POLICY "Admins can delete OKR key results"
  ON public.okr_key_results FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_objectives oo
      JOIN public.okr_quarters oq ON oq.id = oo.okr_quarter_id
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_module_roles umr ON umr.role = 'admin'::app_role
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE oo.id = okr_key_results.okr_objective_id
      AND umr.user_id = auth.uid()
      AND umr.active = true
      AND sm.slug = 'okr-planning'
      AND EXISTS (
        SELECT 1 FROM public.user_company_relations ucr
        WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = oy.company_id
      )
    )
  );

-- ================================================
-- 5. OKR ACTIONS TABLE
-- ================================================
CREATE TABLE public.okr_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_key_result_id UUID NOT NULL REFERENCES public.okr_key_results(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_okr_actions_key_result ON public.okr_actions(okr_key_result_id);
CREATE INDEX idx_okr_actions_assigned_to ON public.okr_actions(assigned_to);
CREATE INDEX idx_okr_actions_status ON public.okr_actions(status);

-- Enable RLS
ALTER TABLE public.okr_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for okr_actions
CREATE POLICY "Users can view company OKR actions"
  ON public.okr_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_key_results okr
      JOIN public.okr_objectives oo ON oo.id = okr.okr_objective_id
      JOIN public.okr_quarters oq ON oq.id = oo.okr_quarter_id
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_company_relations ucr ON ucr.company_id = oy.company_id
      WHERE okr.id = okr_actions.okr_key_result_id
      AND ucr.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create OKR actions"
  ON public.okr_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.okr_key_results okr
      JOIN public.okr_objectives oo ON oo.id = okr.okr_objective_id
      JOIN public.okr_quarters oq ON oq.id = oo.okr_quarter_id
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_company_relations ucr ON ucr.company_id = oy.company_id
      WHERE okr.id = okr_actions.okr_key_result_id
      AND ucr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assigned or owned actions"
  ON public.okr_actions FOR UPDATE
  USING (
    auth.uid() = assigned_to OR 
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.okr_key_results okr
      WHERE okr.id = okr_actions.okr_key_result_id
      AND okr.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.okr_key_results okr
      JOIN public.okr_objectives oo ON oo.id = okr.okr_objective_id
      JOIN public.okr_quarters oq ON oq.id = oo.okr_quarter_id
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_module_roles umr ON umr.role IN ('admin'::app_role, 'manager'::app_role)
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE okr.id = okr_actions.okr_key_result_id
      AND umr.user_id = auth.uid()
      AND umr.active = true
      AND sm.slug = 'okr-planning'
    )
  );

CREATE POLICY "Admins and managers can delete OKR actions"
  ON public.okr_actions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_key_results okr
      JOIN public.okr_objectives oo ON oo.id = okr.okr_objective_id
      JOIN public.okr_quarters oq ON oq.id = oo.okr_quarter_id
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_module_roles umr ON umr.role IN ('admin'::app_role, 'manager'::app_role)
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE okr.id = okr_actions.okr_key_result_id
      AND umr.user_id = auth.uid()
      AND umr.active = true
      AND sm.slug = 'okr-planning'
    )
  );

-- ================================================
-- 6. OKR CHECK-INS TABLE
-- ================================================
CREATE TABLE public.okr_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_key_result_id UUID NOT NULL REFERENCES public.okr_key_results(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_value NUMERIC NOT NULL,
  confidence_level VARCHAR(20) CHECK (confidence_level IN ('low', 'medium', 'high')),
  status_update TEXT,
  challenges TEXT,
  next_steps TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_okr_check_ins_key_result ON public.okr_check_ins(okr_key_result_id);
CREATE INDEX idx_okr_check_ins_date ON public.okr_check_ins(check_in_date DESC);

-- Enable RLS
ALTER TABLE public.okr_check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for okr_check_ins
CREATE POLICY "Users can view company OKR check-ins"
  ON public.okr_check_ins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_key_results okr
      JOIN public.okr_objectives oo ON oo.id = okr.okr_objective_id
      JOIN public.okr_quarters oq ON oq.id = oo.okr_quarter_id
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_company_relations ucr ON ucr.company_id = oy.company_id
      WHERE okr.id = okr_check_ins.okr_key_result_id
      AND ucr.user_id = auth.uid()
    )
  );

CREATE POLICY "KR owners and managers can create check-ins"
  ON public.okr_check_ins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.okr_key_results okr
      JOIN public.okr_objectives oo ON oo.id = okr.okr_objective_id
      JOIN public.okr_quarters oq ON oq.id = oo.okr_quarter_id
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      WHERE okr.id = okr_check_ins.okr_key_result_id
      AND (
        okr.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.user_module_roles umr
          JOIN public.system_modules sm ON sm.id = umr.module_id
          WHERE umr.user_id = auth.uid()
          AND umr.role IN ('admin'::app_role, 'manager'::app_role)
          AND umr.active = true
          AND sm.slug = 'okr-planning'
        )
      )
      AND EXISTS (
        SELECT 1 FROM public.user_company_relations ucr
        WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = oy.company_id
      )
    )
  );

CREATE POLICY "Check-in creators can update their check-ins"
  ON public.okr_check_ins FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete check-ins"
  ON public.okr_check_ins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.okr_key_results okr
      JOIN public.okr_objectives oo ON oo.id = okr.okr_objective_id
      JOIN public.okr_quarters oq ON oq.id = oo.okr_quarter_id
      JOIN public.okr_years oy ON oy.id = oq.okr_year_id
      JOIN public.user_module_roles umr ON umr.role = 'admin'::app_role
      JOIN public.system_modules sm ON sm.id = umr.module_id
      WHERE okr.id = okr_check_ins.okr_key_result_id
      AND umr.user_id = auth.uid()
      AND umr.active = true
      AND sm.slug = 'okr-planning'
    )
  );

-- ================================================
-- 7. TRIGGERS FOR UPDATED_AT
-- ================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_okr_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply triggers to all tables
CREATE TRIGGER update_okr_years_updated_at
  BEFORE UPDATE ON public.okr_years
  FOR EACH ROW
  EXECUTE FUNCTION public.update_okr_updated_at();

CREATE TRIGGER update_okr_quarters_updated_at
  BEFORE UPDATE ON public.okr_quarters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_okr_updated_at();

CREATE TRIGGER update_okr_objectives_updated_at
  BEFORE UPDATE ON public.okr_objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_okr_updated_at();

CREATE TRIGGER update_okr_key_results_updated_at
  BEFORE UPDATE ON public.okr_key_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_okr_updated_at();

CREATE TRIGGER update_okr_actions_updated_at
  BEFORE UPDATE ON public.okr_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_okr_updated_at();

-- ================================================
-- 8. TRIGGER FOR AUTOMATIC CHECK-IN VALUE UPDATE
-- ================================================

-- Function to update KR current_value when check-in is created
CREATE OR REPLACE FUNCTION public.update_kr_from_check_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the key result's current value with the check-in value
  UPDATE public.okr_key_results
  SET 
    current_value = NEW.current_value,
    updated_at = now()
  WHERE id = NEW.okr_key_result_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_kr_on_check_in
  AFTER INSERT ON public.okr_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kr_from_check_in();

-- ================================================
-- 9. FUNCTION TO CALCULATE KR PROGRESS
-- ================================================

CREATE OR REPLACE FUNCTION public.calculate_kr_progress(
  _initial_value NUMERIC,
  _current_value NUMERIC,
  _target_value NUMERIC,
  _target_direction VARCHAR
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  progress NUMERIC;
BEGIN
  -- Avoid division by zero
  IF _target_value = _initial_value THEN
    IF _current_value = _target_value THEN
      RETURN 100;
    ELSE
      RETURN 0;
    END IF;
  END IF;

  -- Calculate progress based on direction
  IF _target_direction = 'maximize' THEN
    progress := ((_current_value - _initial_value) / (_target_value - _initial_value)) * 100;
  ELSE -- minimize
    progress := ((_initial_value - _current_value) / (_initial_value - _target_value)) * 100;
  END IF;

  -- Cap at 0-100 range
  progress := GREATEST(0, LEAST(100, progress));
  
  RETURN ROUND(progress, 2);
END;
$$;

-- ================================================
-- 10. TRIGGER TO AUTO-CALCULATE KR PROGRESS
-- ================================================

CREATE OR REPLACE FUNCTION public.auto_calculate_kr_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate and update progress percentage
  NEW.progress_percentage := public.calculate_kr_progress(
    NEW.initial_value,
    NEW.current_value,
    NEW.target_value,
    NEW.target_direction
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_kr_progress_on_change
  BEFORE INSERT OR UPDATE OF current_value, target_value, initial_value, target_direction
  ON public.okr_key_results
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_calculate_kr_progress();