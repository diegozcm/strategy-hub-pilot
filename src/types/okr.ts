// =============================================
// TIPOS PARA MÓDULO OKR EXECUTION
// =============================================

export type OKRYearStatus = 'draft' | 'active' | 'completed' | 'archived';
export type OKRPeriodStatus = 'draft' | 'active' | 'completed' | 'archived';
export type OKRObjectiveStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'on_hold';
export type OKRKeyResultStatus = 'draft' | 'active' | 'completed' | 'at_risk' | 'off_track';
export type OKRInitiativeStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
export type OKRInitiativePriority = 'low' | 'medium' | 'high' | 'critical';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type OKRTransitionType = 'automatic' | 'manual';

export interface OKRYear {
  id: string;
  company_id: string;
  year: number;
  start_date: string;
  end_date: string;
  status: OKRYearStatus;
  is_locked: boolean;
  overall_progress_percentage: number;
  total_objectives: number;
  completed_objectives: number;
  total_key_results: number;
  completed_key_results: number;
  total_initiatives: number;
  completed_initiatives: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OKRPeriod {
  id: string;
  okr_year_id: string;
  company_id: string;
  quarter: Quarter;
  start_date: string;
  end_date: string;
  status: OKRPeriodStatus;
  is_locked: boolean;
  overall_progress_percentage: number;
  total_objectives: number;
  completed_objectives: number;
  total_key_results: number;
  completed_key_results: number;
  total_initiatives: number;
  completed_initiatives: number;
  created_at: string;
  updated_at: string;
}

export interface OKRObjective {
  id: string;
  okr_period_id: string;
  company_id: string;
  title: string;
  description?: string;
  responsible?: string;
  status: OKRObjectiveStatus;
  progress_percentage: number;
  total_key_results: number;
  completed_key_results: number;
  strategic_objective_id?: string;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OKRKeyResult {
  id: string;
  okr_objective_id: string;
  company_id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  target_direction: 'maximize' | 'minimize';
  progress_percentage: number;
  status: OKRKeyResultStatus;
  responsible?: string;
  total_initiatives: number;
  completed_initiatives: number;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OKRInitiative {
  id: string;
  okr_key_result_id: string;
  company_id: string;
  title: string;
  description?: string;
  status: OKRInitiativeStatus;
  priority: OKRInitiativePriority;
  responsible?: string;
  due_date?: string;
  completed_at?: string;
  is_in_backlog: boolean;
  allocated_quarter?: Quarter;
  evidence_links?: string[];
  notes?: string;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OKRYearTransition {
  id: string;
  company_id: string;
  from_year_id: string;
  to_year_id: string;
  transition_date: string;
  transition_type: OKRTransitionType;
  performed_by: string;
  notes?: string;
  objectives_carried_over: number;
  objectives_completed: number;
  objectives_cancelled: number;
  created_at: string;
}

// Tipos auxiliares para formulários
export interface CreateOKRYearData {
  year: number;
  start_date: string;
  end_date: string;
}

export interface CreateOKRObjectiveData {
  okr_period_id: string;
  title: string;
  description?: string;
  responsible?: string;
  strategic_objective_id?: string;
}

export interface CreateOKRKeyResultData {
  okr_objective_id: string;
  title: string;
  description?: string;
  target_value: number;
  unit: string;
  target_direction?: 'maximize' | 'minimize';
  responsible?: string;
}

export interface CreateOKRInitiativeData {
  okr_key_result_id: string;
  title: string;
  description?: string;
  priority?: OKRInitiativePriority;
  responsible?: string;
  due_date?: string;
  is_in_backlog?: boolean;
  allocated_quarter?: Quarter;
}
