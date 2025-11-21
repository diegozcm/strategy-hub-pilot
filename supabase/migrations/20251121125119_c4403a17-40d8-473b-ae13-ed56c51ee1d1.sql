-- =============================================
-- CORREÇÃO DE SEGURANÇA - Adicionar search_path às funções OKR
-- =============================================

-- Recriar funções com SET search_path = public
CREATE OR REPLACE FUNCTION public.update_okr_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_kr_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kr_id UUID;
  total_inits INTEGER;
  completed_inits INTEGER;
  new_progress NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    kr_id := OLD.okr_key_result_id;
  ELSE
    kr_id := NEW.okr_key_result_id;
  END IF;

  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_inits, completed_inits
  FROM public.okr_initiatives
  WHERE okr_key_result_id = kr_id;

  IF total_inits > 0 THEN
    new_progress := (completed_inits::NUMERIC / total_inits::NUMERIC) * 100;
  ELSE
    new_progress := 0;
  END IF;

  UPDATE public.okr_key_results
  SET 
    progress_percentage = new_progress,
    total_initiatives = total_inits,
    completed_initiatives = completed_inits,
    current_value = new_progress,
    updated_at = now()
  WHERE id = kr_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_objective_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  obj_id UUID;
  total_krs INTEGER;
  completed_krs INTEGER;
  avg_progress NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    obj_id := OLD.okr_objective_id;
  ELSE
    obj_id := NEW.okr_objective_id;
  END IF;

  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    AVG(progress_percentage)
  INTO total_krs, completed_krs, avg_progress
  FROM public.okr_key_results
  WHERE okr_objective_id = obj_id;

  UPDATE public.okr_objectives
  SET 
    progress_percentage = COALESCE(avg_progress, 0),
    total_key_results = total_krs,
    completed_key_results = completed_krs,
    updated_at = now()
  WHERE id = obj_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_period_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF TG_OP = 'DELETE' THEN
    period_id := OLD.okr_period_id;
  ELSE
    period_id := NEW.okr_period_id;
  END IF;

  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    AVG(progress_percentage)
  INTO total_objs, completed_objs, avg_progress
  FROM public.okr_objectives
  WHERE okr_period_id = period_id;

  SELECT 
    COALESCE(SUM(total_key_results), 0),
    COALESCE(SUM(completed_key_results), 0)
  INTO total_krs, completed_krs
  FROM public.okr_objectives
  WHERE okr_period_id = period_id;

  SELECT 
    COALESCE(SUM(kr.total_initiatives), 0),
    COALESCE(SUM(kr.completed_initiatives), 0)
  INTO total_inits, completed_inits
  FROM public.okr_key_results kr
  JOIN public.okr_objectives obj ON obj.id = kr.okr_objective_id
  WHERE obj.okr_period_id = period_id;

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
$$;

CREATE OR REPLACE FUNCTION public.recalculate_year_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF TG_OP = 'DELETE' THEN
    year_id := OLD.okr_year_id;
  ELSE
    year_id := NEW.okr_year_id;
  END IF;

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
$$;