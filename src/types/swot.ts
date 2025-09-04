export interface SwotAnalysis {
  id: string;
  company_id: string;
  strengths?: string;
  weaknesses?: string;
  opportunities?: string;
  threats?: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface SwotHistory {
  id: string;
  swot_analysis_id: string;
  previous_strengths?: string;
  previous_weaknesses?: string;
  previous_opportunities?: string;
  previous_threats?: string;
  changed_by: string;
  change_reason?: string;
  changed_at: string;
}

export interface SwotFormData {
  strengths?: string;
  weaknesses?: string;
  opportunities?: string;
  threats?: string;
  change_reason?: string;
}