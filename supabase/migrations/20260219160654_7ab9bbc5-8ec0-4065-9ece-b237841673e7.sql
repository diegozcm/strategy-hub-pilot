
-- 1. Create governance-documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('governance-documents', 'governance-documents', false);

-- 2. Create governance_rule_documents table
CREATE TABLE public.governance_rule_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_company_document UNIQUE (company_id)
);

ALTER TABLE public.governance_rule_documents ENABLE ROW LEVEL SECURITY;

-- RLS: SELECT - any company member
CREATE POLICY "Company members can view governance documents"
  ON public.governance_rule_documents FOR SELECT
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

-- RLS: INSERT - company members (app layer restricts to managers)
CREATE POLICY "Company members can insert governance documents"
  ON public.governance_rule_documents FOR INSERT
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

-- RLS: UPDATE - company members
CREATE POLICY "Company members can update governance documents"
  ON public.governance_rule_documents FOR UPDATE
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

-- RLS: DELETE - company members
CREATE POLICY "Company members can delete governance documents"
  ON public.governance_rule_documents FOR DELETE
  USING (public.user_belongs_to_company(auth.uid(), company_id) OR public.is_system_admin(auth.uid()));

-- 3. Storage policies for governance-documents bucket
CREATE POLICY "Company members can download governance documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'governance-documents' AND public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid));

CREATE POLICY "Company members can upload governance documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'governance-documents' AND public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid));

CREATE POLICY "Company members can update governance documents storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'governance-documents' AND public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid));

CREATE POLICY "Company members can delete governance documents storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'governance-documents' AND public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid));

-- 4. Trigger for updated_at
CREATE TRIGGER update_governance_rule_documents_updated_at
  BEFORE UPDATE ON public.governance_rule_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
