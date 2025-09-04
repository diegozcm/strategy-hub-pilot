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
  status: string;
  owner_id: string;
  monthly_targets?: any;
  monthly_actual?: any;
  yearly_target?: number;
  yearly_actual?: number;
  projects?: StrategicProject[];
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

export type MetricType = 'percentage' | 'number' | 'currency' | 'time';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type Status = 'not_started' | 'in_progress' | 'completed' | 'suspended';
export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'suspended';