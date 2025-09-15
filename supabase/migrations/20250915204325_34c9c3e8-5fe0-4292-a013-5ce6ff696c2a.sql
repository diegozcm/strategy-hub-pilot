-- Create AI configuration settings per company
CREATE TABLE public.ai_company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  model VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER NOT NULL DEFAULT 1000 CHECK (max_tokens > 0 AND max_tokens <= 4000),
  web_search_enabled BOOLEAN NOT NULL DEFAULT false,
  agent_profile TEXT NOT NULL DEFAULT 'assistant',
  voice_enabled BOOLEAN NOT NULL DEFAULT false,
  voice_model VARCHAR(50) DEFAULT 'tts-1',
  voice_id VARCHAR(50) DEFAULT 'alloy',
  system_prompt TEXT DEFAULT 'Você é um assistente especializado em análise estratégica e gestão empresarial. Forneça insights precisos e acionáveis.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.ai_company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company AI settings" 
ON public.ai_company_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_company_relations ucr 
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = ai_company_settings.company_id
));

CREATE POLICY "Users can create their company AI settings" 
ON public.ai_company_settings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM user_company_relations ucr 
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = ai_company_settings.company_id
) AND auth.uid() = created_by);

CREATE POLICY "Users can update their company AI settings" 
ON public.ai_company_settings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM user_company_relations ucr 
  WHERE ucr.user_id = auth.uid() AND ucr.company_id = ai_company_settings.company_id
));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_ai_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ai_company_settings_updated_at
BEFORE UPDATE ON public.ai_company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_ai_settings_updated_at();