CREATE TABLE public.company_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  admin_user_id uuid NOT NULL,
  import_mode text NOT NULL,
  source_company_name text,
  source_company_id text,
  tables_imported text[],
  total_records integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.company_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only system admins can access import logs"
  ON public.company_import_logs FOR ALL
  USING (public.is_system_admin(auth.uid()));