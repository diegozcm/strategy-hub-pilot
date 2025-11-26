-- Create company_module_settings table
CREATE TABLE IF NOT EXISTS public.company_module_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_slug VARCHAR(50) NOT NULL,
  
  -- Configuração de Vigência (booleano)
  validity_enabled BOOLEAN DEFAULT false,
  
  -- Campo JSONB para futuras configurações
  settings JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(company_id, module_slug)
);

-- Habilitar RLS
ALTER TABLE public.company_module_settings ENABLE ROW LEVEL SECURITY;

-- Policy para gerentes e admins visualizarem
CREATE POLICY "Managers can view module settings" ON public.company_module_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      JOIN public.profiles p ON p.user_id = ucr.user_id
      WHERE ucr.company_id = company_module_settings.company_id
      AND ucr.user_id = auth.uid()
      AND p.role IN ('manager', 'admin')
    )
  );

-- Policy para gerentes e admins gerenciarem
CREATE POLICY "Managers can manage module settings" ON public.company_module_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_company_relations ucr
      JOIN public.profiles p ON p.user_id = ucr.user_id
      WHERE ucr.company_id = company_module_settings.company_id
      AND ucr.user_id = auth.uid()
      AND p.role IN ('manager', 'admin')
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_company_module_settings_updated_at
  BEFORE UPDATE ON public.company_module_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index para melhor performance
CREATE INDEX idx_company_module_settings_company_module 
  ON public.company_module_settings(company_id, module_slug);