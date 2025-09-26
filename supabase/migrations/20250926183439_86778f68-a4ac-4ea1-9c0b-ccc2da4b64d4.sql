-- Verificar se a tabela existe e criar apenas se não existir
CREATE TABLE IF NOT EXISTS public.kr_status_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key_result_id UUID NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status_summary TEXT NOT NULL,
    challenges TEXT,
    achievements TEXT,
    next_steps TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.kr_status_reports ENABLE ROW LEVEL SECURITY;

-- Criar função para atualizar updated_at se não existir
CREATE OR REPLACE FUNCTION public.update_kr_status_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para updated_at se não existir
DROP TRIGGER IF EXISTS update_kr_status_reports_updated_at ON public.kr_status_reports;
CREATE TRIGGER update_kr_status_reports_updated_at
    BEFORE UPDATE ON public.kr_status_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_kr_status_reports_updated_at();

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_kr_status_reports_key_result_id 
ON public.kr_status_reports (key_result_id);

CREATE INDEX IF NOT EXISTS idx_kr_status_reports_report_date 
ON public.kr_status_reports (report_date);

CREATE INDEX IF NOT EXISTS idx_kr_status_reports_created_by 
ON public.kr_status_reports (created_by);