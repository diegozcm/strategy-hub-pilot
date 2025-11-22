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
  quarter_name?: string;
}

// NOVA INTERFACE: OKRPillar
export interface OKRPillar {
  id: string;
  company_id: string;
  okr_year_id: string;
  name: string;
  description?: string | null;
  sponsor_id: string;
  color?: string | null;
  icon?: string | null;
  order_index: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  sponsor?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  objectives?: OKRObjective[];
}

export interface OKRObjective {
  id: string;
  okr_pillar_id: string; // MUDOU de okr_quarter_id
  okr_quarter_id?: string | null; // Manter temporariamente para compatibilidade
  sponsor_id: string; // NOVO
  title: string;
  description?: string | null;
  owner_id: string;
  status: string;
  priority: string;
  progress_percentage: number | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  sponsor?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  owner?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  key_results?: OKRKeyResult[];
}

// NOVA INTERFACE: ChecklistItem
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completed_at?: string | null;
  completed_by?: string | null;
}

export interface OKRKeyResult {
  id: string;
  okr_objective_id: string;
  title: string;
  description?: string | null;
  owner_id: string;
  tracking_type: 'numeric' | 'checklist'; // NOVO
  quarter?: number | null; // NOVO (1-4)
  
  // Campos para tipo 'numeric'
  initial_value: number | null;
  current_value: number | null;
  target_value: number;
  unit: string | null; // '%', 'R$', 'Unidade'
  metric_type: string;
  target_direction: string;
  
  // Campos para tipo 'checklist'
  checklist_items?: ChecklistItem[] | null; // NOVO
  checklist_completed?: number; // NOVO
  checklist_total?: number; // NOVO
  
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
  actions?: OKRAction[];
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
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export type OKRStatus = 'not_started' | 'on_track' | 'at_risk' | 'off_track' | 'completed' | 'delayed';
export type OKRPriority = 'high' | 'medium' | 'low';
export type TargetDirection = 'maximize' | 'minimize';
export type TrackingType = 'numeric' | 'checklist';

// Quarter periods para filtros
export interface QuarterPeriod {
  quarter: 1 | 2 | 3 | 4;
  label: string;
  start_month: number;
  end_month: number;
  getStartDate: (year: number) => Date;
  getEndDate: (year: number) => Date;
}

export const QUARTERS: QuarterPeriod[] = [
  { 
    quarter: 1, 
    label: 'Q1', 
    start_month: 1, 
    end_month: 3, 
    getStartDate: (y) => new Date(y, 0, 1), 
    getEndDate: (y) => new Date(y, 2, 31) 
  },
  { 
    quarter: 2, 
    label: 'Q2', 
    start_month: 4, 
    end_month: 6,
    getStartDate: (y) => new Date(y, 3, 1), 
    getEndDate: (y) => new Date(y, 5, 30) 
  },
  { 
    quarter: 3, 
    label: 'Q3', 
    start_month: 7, 
    end_month: 9,
    getStartDate: (y) => new Date(y, 6, 1), 
    getEndDate: (y) => new Date(y, 8, 30) 
  },
  { 
    quarter: 4, 
    label: 'Q4', 
    start_month: 10, 
    end_month: 12,
    getStartDate: (y) => new Date(y, 9, 1), 
    getEndDate: (y) => new Date(y, 11, 31) 
  },
];
