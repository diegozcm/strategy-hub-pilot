-- Fase 1: Atualizar função assign_user_to_company_v2 (remover parâmetro _role)
CREATE OR REPLACE FUNCTION assign_user_to_company_v2(
  _admin_id uuid,
  _user_id uuid,
  _company_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o admin tem permissão
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular usuários a empresas';
  END IF;

  -- Inserir ou atualizar relação (sem role)
  INSERT INTO public.user_company_relations (user_id, company_id, created_at, updated_at)
  VALUES (_user_id, _company_id, now(), now())
  ON CONFLICT (user_id, company_id) DO UPDATE SET
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- Fase 2: Atualizar função analyze_user_relations (remover role do output)
CREATE OR REPLACE FUNCTION analyze_user_relations(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'user_id', _user_id,
    'total_companies', COUNT(DISTINCT ucr.company_id),
    'participation_relations', json_agg(
      json_build_object(
        'company_id', ucr.company_id
      )
    )
  ) INTO result
  FROM user_company_relations ucr
  WHERE ucr.user_id = _user_id;

  RETURN result;
END;
$$;

-- Fase 3: Remover coluna role de user_company_relations
ALTER TABLE user_company_relations DROP COLUMN IF EXISTS role;