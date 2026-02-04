-- =============================================================
-- Migration: Permitir Membros Atualizarem Progresso de Iniciativas
-- =============================================================

-- DROP política restritiva atual
DROP POLICY IF EXISTS "Managers can update KR initiatives" ON public.kr_initiatives;

-- Nova política UPDATE: Todos da empresa podem fazer UPDATE
-- O trigger abaixo vai controlar QUAIS campos cada role pode alterar
CREATE POLICY "Company users can update KR initiatives"
ON public.kr_initiatives
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_company_relations ucr
    WHERE ucr.user_id = auth.uid() 
    AND ucr.company_id = kr_initiatives.company_id
  )
);

-- Trigger para proteger campos sensíveis - apenas managers podem alterar tudo
-- Membros podem alterar APENAS progress_percentage e status
CREATE OR REPLACE FUNCTION public.restrict_initiative_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não é manager no Strategy HUB, só permite alterar progresso e status
  IF NOT is_strategy_hub_manager(auth.uid()) THEN
    -- Preservar todos os campos que membros NÃO podem alterar
    NEW.title := OLD.title;
    NEW.description := OLD.description;
    NEW.start_date := OLD.start_date;
    NEW.end_date := OLD.end_date;
    NEW.responsible := OLD.responsible;
    NEW.budget := OLD.budget;
    NEW.priority := OLD.priority;
    NEW.completion_notes := OLD.completion_notes;
    NEW.position := OLD.position;
    -- Campos permitidos para membros: progress_percentage, status
    -- (esses NÃO são sobrescritos, então o UPDATE funciona normalmente)
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger se existir
DROP TRIGGER IF EXISTS tr_restrict_initiative_updates ON public.kr_initiatives;

-- Criar trigger
CREATE TRIGGER tr_restrict_initiative_updates
BEFORE UPDATE ON public.kr_initiatives
FOR EACH ROW
EXECUTE FUNCTION public.restrict_initiative_updates();