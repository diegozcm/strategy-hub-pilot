import type { Json } from '@/integrations/supabase/types';

export interface MentoringTip {
  id: string;
  mentor_id: string;
  startup_company_id?: string;
  session_id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  is_public: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MentoringSession {
  id: string;
  mentor_id: string;
  startup_company_id: string;
  session_date: string;
  duration: number;
  session_type: string;
  notes?: string;
  action_items?: Json;
  beep_related_items?: Json;
  follow_up_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
  mentor_name?: string;
  startup_name?: string;
  tips?: MentoringTip[];
  tips_count?: number;
}

export interface MentoringSessionWithActions extends Omit<MentoringSession, 'action_items'> {
  action_items?: string[];
}