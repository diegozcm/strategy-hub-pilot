/**
 * OKR Planning Module - Type Definitions
 */

export interface OKRYear {
  id: string;
  company_id: string;
  year: number;
  theme?: string | null;
  description?: string | null;
  status: string;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface OKRQuarter {
  id: string;
  okr_year_id: string;
  quarter: number;
  start_date: string;
  end_date: string;
  theme?: string | null;
  status: string;
  progress_percentage: number | null;
  created_at: string;
  updated_at: string;
  // Computed properties
  quarter_name?: string;
}

export interface OKRObjective {
  id: string;
  okr_quarter_id: string;
  title: string;
  description?: string | null;
  owner_id: string;
  status: string;
  priority: string;
  progress_percentage: number | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  owner?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  key_results?: OKRKeyResult[];
}

export interface OKRKeyResult {
  id: string;
  okr_objective_id: string;
  title: string;
  description?: string | null;
  owner_id: string;
  initial_value: number | null;
  current_value: number | null;
  target_value: number;
  unit: string | null;
  metric_type: string;
  target_direction: string;
  status: string;
  progress_percentage: number | null;
  due_date?: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  owner?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface OKRCheckIn {
  id: string;
  okr_key_result_id: string;
  current_value: number;
  confidence_level: 'low' | 'medium' | 'high';
  status_update?: string;
  challenges?: string;
  next_steps?: string;
  created_by: string;
  check_in_date: string;
  created_at: string;
  updated_at: string;
}

export interface OKRAction {
  id: string;
  okr_key_result_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type OKRStatus = 'not_started' | 'on_track' | 'at_risk' | 'off_track' | 'completed' | 'delayed';
export type OKRPriority = 'high' | 'medium' | 'low';
export type TargetDirection = 'maximize' | 'minimize';
