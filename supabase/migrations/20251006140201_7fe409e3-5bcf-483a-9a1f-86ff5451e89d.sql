-- Add ai_enabled column to companies table
ALTER TABLE public.companies 
ADD COLUMN ai_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.companies.ai_enabled IS 
'Indica se a empresa tem acesso aos recursos de IA (Copilot, chat flutuante)';