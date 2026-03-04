
-- 1. Add relation_type column to user_company_relations
ALTER TABLE public.user_company_relations 
ADD COLUMN IF NOT EXISTS relation_type TEXT NOT NULL DEFAULT 'member';

-- 2. Add check constraint via trigger (avoid immutable check constraint issues)
CREATE OR REPLACE FUNCTION public.validate_relation_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.relation_type NOT IN ('member', 'consultant') THEN
    RAISE EXCEPTION 'relation_type must be either ''member'' or ''consultant''';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_relation_type ON public.user_company_relations;
CREATE TRIGGER trg_validate_relation_type
  BEFORE INSERT OR UPDATE ON public.user_company_relations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_relation_type();

-- 3. Create index for fast filtering
CREATE INDEX IF NOT EXISTS idx_user_company_relations_type 
ON public.user_company_relations (company_id, relation_type);

-- 4. Update get_company_users RPC to accept optional _relation_type parameter
CREATE OR REPLACE FUNCTION public.get_company_users(_company_id uuid, _relation_type text DEFAULT NULL)
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  avatar_url text,
  status text,
  relation_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.avatar_url,
    p.status,
    ucr.relation_type
  FROM user_company_relations ucr
  JOIN profiles p ON p.user_id = ucr.user_id
  WHERE ucr.company_id = _company_id
    AND (_relation_type IS NULL OR ucr.relation_type = _relation_type);
$$;
