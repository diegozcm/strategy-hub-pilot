export interface VisionAlignment {
  id: string;
  company_id: string;
  shared_objectives?: string;
  shared_commitments?: string;
  shared_resources?: string;
  shared_risks?: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface VisionAlignmentHistory {
  id: string;
  vision_alignment_id: string;
  previous_shared_objectives?: string;
  previous_shared_commitments?: string;
  previous_shared_resources?: string;
  previous_shared_risks?: string;
  changed_by: string;
  change_reason?: string;
  changed_at: string;
  profiles?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface VisionAlignmentObjective {
  id: string;
  vision_alignment_id: string;
  dimension: 'objectives' | 'commitments' | 'resources' | 'risks';
  title: string;
  description?: string;
  order_index: number;
  color: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface VisionAlignmentObjectiveFormData {
  title: string;
  description?: string;
  color: string;
}

export interface VisionAlignmentFormData {
  shared_objectives?: string;
  shared_commitments?: string;
  shared_resources?: string;
  shared_risks?: string;
  change_reason?: string;
}