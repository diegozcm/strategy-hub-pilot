export interface Company {
  id: string;
  name: string;
  mission?: string;
  vision?: string;
  values?: string[];
  logo_url?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface StrategicPillar {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  color: string;
  order_index: number;
  objectives?: StrategicObjective[];
  created_at: string;
  updated_at: string;
}

export interface StrategicObjective {
  id: string;
  plan_id: string;
  pillar_id: string;
  title: string;
  description?: string;
  responsible?: string;
  deadline?: string;
  status: string;
  progress: number;
  owner_id: string;
  target_date?: string;
  weight?: number;
  monthly_targets?: any;
  monthly_actual?: any;
  yearly_target?: number;
  yearly_actual?: number;
  keyResults?: KeyResult[];
  projects?: StrategicProject[];
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: string;
  objective_id: string;
  title: string;
  description?: string;
  metric_type?: string;
  target_value: number;
  current_value: number;
  unit?: string;
  frequency?: string;
  responsible?: string;
  deadline?: string;
  due_date?: string;
  owner_id: string;
  monthly_targets?: any;
  monthly_actual?: any;
  yearly_target?: number;
  yearly_actual?: number;
  aggregation_type?: 'sum' | 'average' | 'max' | 'min';
  projects?: StrategicProject[];
  monthly_actions?: KRMonthlyAction[];
  created_at: string;
  updated_at: string;
}

export interface StrategicProject {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  responsible?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  progress: number;
  priority?: string;
  plan_id?: string;
  company_id?: string;
  owner_id: string;
  objectives?: StrategicObjective[];
  keyResults?: KeyResult[];
  created_at: string;
  updated_at: string;
}

export interface ProjectObjectiveRelation {
  id: string;
  project_id: string;
  objective_id: string;
  created_at: string;
}

export interface ProjectKRRelation {
  id: string;
  project_id: string;
  kr_id: string;
  created_at: string;
}

export interface KRMonthlyAction {
  id: string;
  key_result_id: string;
  month_year: string; // "2024-01"
  action_title: string;
  action_description?: string;
  planned_value?: number;
  actual_value?: number;
  completion_percentage: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  responsible?: string;
  start_date?: string;
  end_date?: string;
  evidence_links?: string[];
  notes?: string;
  fca_id?: string; // Foreign key to KRFCA
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KRActionsHistory {
  id: string;
  action_id: string;
  changed_by: string;
  changed_at: string;
  change_type: 'created' | 'updated' | 'status_changed' | 'completed';
  previous_data?: any;
  new_data?: any;
  change_reason?: string;
}

export interface KRFCA {
  id: string;
  key_result_id: string;
  title: string;
  fact: string;
  cause: string;
  description?: string;
  priority: FCAPriority;
  status: FCAStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  actions?: KRMonthlyAction[]; // Related actions
}

export type MetricType = 'percentage' | 'number' | 'currency' | 'time';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'suspended';
export type ActionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type ActionPriority = 'low' | 'medium' | 'high';
export interface KRInitiative {
  id: string;
  key_result_id: string;
  company_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: InitiativeStatus;
  priority: InitiativePriority;
  responsible?: string;
  budget?: number;
  progress_percentage: number;
  completion_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type FCAStatus = 'active' | 'resolved' | 'cancelled';
export type FCAPriority = 'low' | 'medium' | 'high';
export type InitiativeStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type InitiativePriority = 'low' | 'medium' | 'high';