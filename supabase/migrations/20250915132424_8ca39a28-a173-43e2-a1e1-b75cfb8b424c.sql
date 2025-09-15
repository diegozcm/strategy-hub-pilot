-- Fix FCA Actions creation by improving database constraints and validation

-- 1. Backfill any inconsistent kr_monthly_actions records
UPDATE public.kr_monthly_actions kma 
SET key_result_id = kf.key_result_id 
FROM public.kr_fca kf 
WHERE kma.fca_id = kf.id 
  AND kma.key_result_id <> kf.key_result_id;

-- 2. Add unique constraint on kr_fca to support composite FK
ALTER TABLE public.kr_fca 
ADD CONSTRAINT unique_kr_fca_id_key_result UNIQUE (id, key_result_id);

-- 3. Drop the old duplicate FK constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'kr_monthly_actions_fca_id_fkey' 
        AND table_name = 'kr_monthly_actions'
    ) THEN
        ALTER TABLE public.kr_monthly_actions DROP CONSTRAINT kr_monthly_actions_fca_id_fkey;
    END IF;
END $$;

-- 4. Add composite foreign key to ensure FCA belongs to the same KR as the action  
ALTER TABLE public.kr_monthly_actions 
ADD CONSTRAINT fk_kr_monthly_actions_fca_kr_composite 
FOREIGN KEY (fca_id, key_result_id) 
REFERENCES public.kr_fca(id, key_result_id) 
ON DELETE CASCADE;

-- 5. Improve the validate_fca_for_action function with better error handling
CREATE OR REPLACE FUNCTION public.validate_fca_for_action(_fca_id uuid, _key_result_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
  -- Check if FCA exists, is active, and belongs to the specified key_result
  IF NOT EXISTS (
    SELECT 1 FROM public.kr_fca 
    WHERE id = _fca_id 
    AND key_result_id = _key_result_id 
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'O FCA selecionado não está ativo ou não pertence a este Resultado Chave. Verifique se o FCA está ativo e tente novamente.';
  END IF;
  
  RETURN true;
END;
$function$;

-- 6. Add trigger to prevent actions on inactive FCAs (business rule)
CREATE OR REPLACE FUNCTION public.check_fca_active_for_action()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $function$
BEGIN
  -- Only check if fca_id is being set (not null)
  IF NEW.fca_id IS NOT NULL THEN
    -- Check if FCA is active
    IF NOT EXISTS (
      SELECT 1 FROM public.kr_fca 
      WHERE id = NEW.fca_id 
      AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Não é possível criar ações para FCAs inativos. O FCA deve estar no status "ativo" para receber novas ações.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_check_fca_active_for_action ON public.kr_monthly_actions;
CREATE TRIGGER trigger_check_fca_active_for_action
  BEFORE INSERT OR UPDATE ON public.kr_monthly_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_fca_active_for_action();