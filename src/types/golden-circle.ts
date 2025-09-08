export interface GoldenCircle {
  id: string;
  company_id: string;
  why_question?: string;
  how_question?: string;
  what_question?: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface GoldenCircleHistory {
  id: string;
  golden_circle_id: string;
  previous_why?: string;
  previous_how?: string;
  previous_what?: string;
  changed_by: string;
  change_reason?: string;
  changed_at: string;
  profiles?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface GoldenCircleFormData {
  why_question?: string;
  how_question?: string;
  what_question?: string;
  change_reason?: string;
}