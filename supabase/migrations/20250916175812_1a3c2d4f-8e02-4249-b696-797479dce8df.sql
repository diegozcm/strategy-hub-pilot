-- Create table for KR initiatives
CREATE TABLE IF NOT EXISTS public.kr_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL,
  company_id UUID NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  priority VARCHAR NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  responsible VARCHAR,
  budget DECIMAL(15,2),
  progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completion_notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RLS policies for kr_initiatives
ALTER TABLE public.kr_initiatives ENABLE ROW LEVEL SECURITY;

-- Users can view initiatives for KRs in their company
CREATE POLICY "Users can view company KR initiatives" ON public.kr_initiatives
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
);

-- Users can create initiatives for KRs in their company
CREATE POLICY "Users can create company KR initiatives" ON public.kr_initiatives
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  ) AND created_by = auth.uid()
);

-- Users can update initiatives for KRs in their company
CREATE POLICY "Users can update company KR initiatives" ON public.kr_initiatives
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
);

-- Users can delete initiatives for KRs in their company
CREATE POLICY "Users can delete company KR initiatives" ON public.kr_initiatives
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_kr_initiatives_key_result_id ON public.kr_initiatives(key_result_id);
CREATE INDEX IF NOT EXISTS idx_kr_initiatives_company_id ON public.kr_initiatives(company_id);
CREATE INDEX IF NOT EXISTS idx_kr_initiatives_dates ON public.kr_initiatives(start_date, end_date);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_kr_initiatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kr_initiatives_updated_at
  BEFORE UPDATE ON public.kr_initiatives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kr_initiatives_updated_at();