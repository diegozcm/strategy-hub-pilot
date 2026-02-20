
CREATE TABLE public.company_export_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  admin_user_id uuid NOT NULL,
  export_format text NOT NULL DEFAULT 'xlsx',
  tables_exported text[] NOT NULL,
  total_records integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only system admins can access export logs"
  ON public.company_export_logs FOR ALL
  USING (public.is_system_admin(auth.uid()));
