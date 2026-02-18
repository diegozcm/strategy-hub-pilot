
-- =============================================
-- Governance RMRE: 5 tabelas
-- =============================================

-- 1. governance_rules
CREATE TABLE public.governance_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  description text,
  created_by uuid NOT NULL,
  updated_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.governance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view governance rules of their company"
  ON public.governance_rules FOR SELECT
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Users can insert governance rules for their company"
  ON public.governance_rules FOR INSERT
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Users can update governance rules of their company"
  ON public.governance_rules FOR UPDATE
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Users can delete governance rules of their company"
  ON public.governance_rules FOR DELETE
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

-- 2. governance_rule_items
CREATE TABLE public.governance_rule_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  governance_rule_id uuid NOT NULL REFERENCES public.governance_rules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.governance_rule_items ENABLE ROW LEVEL SECURITY;

-- RLS via parent join
CREATE POLICY "Users can view governance rule items"
  ON public.governance_rule_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.governance_rules gr
    WHERE gr.id = governance_rule_id
    AND (public.user_belongs_to_company(auth.uid(), gr.company_id) OR public.is_system_admin(auth.uid()))
  ));

CREATE POLICY "Users can insert governance rule items"
  ON public.governance_rule_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.governance_rules gr
    WHERE gr.id = governance_rule_id
    AND (public.user_belongs_to_company(auth.uid(), gr.company_id) OR public.is_system_admin(auth.uid()))
  ));

CREATE POLICY "Users can update governance rule items"
  ON public.governance_rule_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.governance_rules gr
    WHERE gr.id = governance_rule_id
    AND (public.user_belongs_to_company(auth.uid(), gr.company_id) OR public.is_system_admin(auth.uid()))
  ));

CREATE POLICY "Users can delete governance rule items"
  ON public.governance_rule_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.governance_rules gr
    WHERE gr.id = governance_rule_id
    AND (public.user_belongs_to_company(auth.uid(), gr.company_id) OR public.is_system_admin(auth.uid()))
  ));

-- 3. governance_meetings
CREATE TABLE public.governance_meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  meeting_type text NOT NULL DEFAULT 'RM',
  scheduled_date date NOT NULL,
  scheduled_time time,
  duration_minutes integer DEFAULT 60,
  location text,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.governance_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view governance meetings of their company"
  ON public.governance_meetings FOR SELECT
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Users can insert governance meetings for their company"
  ON public.governance_meetings FOR INSERT
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Users can update governance meetings of their company"
  ON public.governance_meetings FOR UPDATE
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

CREATE POLICY "Users can delete governance meetings of their company"
  ON public.governance_meetings FOR DELETE
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

-- 4. governance_agenda_items
CREATE TABLE public.governance_agenda_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES public.governance_meetings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  responsible_user_id uuid,
  order_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.governance_agenda_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view governance agenda items"
  ON public.governance_agenda_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.governance_meetings gm
    WHERE gm.id = meeting_id
    AND (public.user_belongs_to_company(auth.uid(), gm.company_id) OR public.is_system_admin(auth.uid()))
  ));

CREATE POLICY "Users can insert governance agenda items"
  ON public.governance_agenda_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.governance_meetings gm
    WHERE gm.id = meeting_id
    AND (public.user_belongs_to_company(auth.uid(), gm.company_id) OR public.is_system_admin(auth.uid()))
  ));

CREATE POLICY "Users can update governance agenda items"
  ON public.governance_agenda_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.governance_meetings gm
    WHERE gm.id = meeting_id
    AND (public.user_belongs_to_company(auth.uid(), gm.company_id) OR public.is_system_admin(auth.uid()))
  ));

CREATE POLICY "Users can delete governance agenda items"
  ON public.governance_agenda_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.governance_meetings gm
    WHERE gm.id = meeting_id
    AND (public.user_belongs_to_company(auth.uid(), gm.company_id) OR public.is_system_admin(auth.uid()))
  ));

-- 5. governance_atas
CREATE TABLE public.governance_atas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES public.governance_meetings(id) ON DELETE CASCADE,
  content text,
  decisions text,
  participants text[] DEFAULT '{}',
  approved boolean NOT NULL DEFAULT false,
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.governance_atas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view governance atas"
  ON public.governance_atas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.governance_meetings gm
    WHERE gm.id = meeting_id
    AND (public.user_belongs_to_company(auth.uid(), gm.company_id) OR public.is_system_admin(auth.uid()))
  ));

CREATE POLICY "Users can insert governance atas"
  ON public.governance_atas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.governance_meetings gm
    WHERE gm.id = meeting_id
    AND (public.user_belongs_to_company(auth.uid(), gm.company_id) OR public.is_system_admin(auth.uid()))
  ));

CREATE POLICY "Users can update governance atas"
  ON public.governance_atas FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.governance_meetings gm
    WHERE gm.id = meeting_id
    AND (public.user_belongs_to_company(auth.uid(), gm.company_id) OR public.is_system_admin(auth.uid()))
  ));

CREATE POLICY "Users can delete governance atas"
  ON public.governance_atas FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.governance_meetings gm
    WHERE gm.id = meeting_id
    AND (public.user_belongs_to_company(auth.uid(), gm.company_id) OR public.is_system_admin(auth.uid()))
  ));

-- Trigger para updated_at em todas as tabelas
CREATE TRIGGER update_governance_rules_updated_at
  BEFORE UPDATE ON public.governance_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_governance_rule_items_updated_at
  BEFORE UPDATE ON public.governance_rule_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_governance_meetings_updated_at
  BEFORE UPDATE ON public.governance_meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_governance_agenda_items_updated_at
  BEFORE UPDATE ON public.governance_agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_governance_atas_updated_at
  BEFORE UPDATE ON public.governance_atas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
