-- Add foreign key constraint between mentoring_sessions and companies
ALTER TABLE public.mentoring_sessions 
ADD CONSTRAINT fk_mentoring_sessions_company 
FOREIGN KEY (startup_company_id) 
REFERENCES public.companies(id) 
ON DELETE CASCADE;