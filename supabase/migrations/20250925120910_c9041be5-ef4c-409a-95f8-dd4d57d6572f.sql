-- Correção de segurança crítica: vision_alignment_removed_dupes
-- Habilitar Row Level Security
ALTER TABLE public.vision_alignment_removed_dupes ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança para restringir acesso por empresa
CREATE POLICY "Users can access vision alignment data for their company" 
ON public.vision_alignment_removed_dupes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_company_relations ucr 
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = vision_alignment_removed_dupes.company_id
  )
);