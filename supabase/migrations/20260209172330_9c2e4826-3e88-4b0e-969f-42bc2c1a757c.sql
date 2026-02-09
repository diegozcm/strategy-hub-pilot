
-- Create password_policies table
CREATE TABLE public.password_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  temp_password_validity_hours INTEGER NOT NULL DEFAULT 168,
  require_password_change BOOLEAN NOT NULL DEFAULT true,
  min_password_length INTEGER NOT NULL DEFAULT 8,
  require_uppercase BOOLEAN NOT NULL DEFAULT true,
  require_lowercase BOOLEAN NOT NULL DEFAULT true,
  require_number BOOLEAN NOT NULL DEFAULT true,
  require_special_char BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Insert default global policy (company_id = NULL means global)
INSERT INTO public.password_policies (company_id, temp_password_validity_hours)
VALUES (NULL, 168);

-- Enable RLS
ALTER TABLE public.password_policies ENABLE ROW LEVEL SECURITY;

-- Admins can manage all policies
CREATE POLICY "System admins can manage password policies"
  ON public.password_policies FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Authenticated users can read policies (needed for login validation)
CREATE POLICY "Authenticated users can read password policies"
  ON public.password_policies FOR SELECT
  USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_password_policies_updated_at
  BEFORE UPDATE ON public.password_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
