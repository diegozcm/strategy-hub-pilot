-- Corrigir ambiguidade na política RLS e adicionar logging na função de criação de startups

-- 1. Primeiro, remover a política problemática
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;

-- 2. Criar política específica para INSERT (mais simples, sem subquery complexa)
CREATE POLICY "Users can insert companies" ON public.companies
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Criar política específica para SELECT (sem conflito durante INSERT)
CREATE POLICY "Users can view companies" ON public.companies
FOR SELECT USING (
  (auth.uid() IS NOT NULL) 
  AND (
    (company_type = 'regular'::company_type) 
    OR (
      (company_type = 'startup'::company_type) 
      AND EXISTS (
        SELECT 1
        FROM public.user_company_relations ucr
        WHERE ucr.company_id = companies.id 
          AND ucr.user_id = auth.uid()
      )
    )
  )
);

-- 4. Vamos criar uma versão melhorada da função com logging detalhado
CREATE OR REPLACE FUNCTION public.create_startup_company_debug(
  _name text, 
  _mission text DEFAULT NULL,
  _vision text DEFAULT NULL,
  _values text[] DEFAULT NULL,
  _logo_url text DEFAULT NULL,
  _owner_id uuid DEFAULT NULL
)
RETURNS TABLE(
  company_id uuid, 
  success boolean, 
  message text,
  step_log text
) LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_company_id uuid;
  existing_profile_count integer;
  step_message text := '';
BEGIN
  -- Log de início
  step_message := 'Iniciando criacao de startup';
  
  -- Definir owner_id se null
  IF _owner_id IS NULL THEN
    _owner_id := auth.uid();
  END IF;

  step_message := step_message || ' | owner_id: ' || COALESCE(_owner_id::text, 'NULL');

  -- Verificar se o usuário é admin
  IF NOT public.has_role(_owner_id, 'admin'::app_role) THEN
    RETURN QUERY SELECT NULL::uuid, FALSE, 'Apenas administradores podem criar empresas startup'::text, step_message;
    RETURN;
  END IF;

  step_message := step_message || ' | Admin verificado';

  -- Criar a empresa startup
  BEGIN
    INSERT INTO public.companies (
      name, 
      mission, 
      vision, 
      values, 
      logo_url, 
      owner_id, 
      company_type, 
      status
    )
    VALUES (
      _name, 
      _mission, 
      _vision, 
      _values, 
      _logo_url, 
      _owner_id, 
      'startup'::company_type, 
      'active'
    )
    RETURNING companies.id INTO new_company_id;
    
    step_message := step_message || ' | Empresa criada: ' || new_company_id::text;
    
  EXCEPTION
    WHEN OTHERS THEN
      step_message := step_message || ' | ERRO ao criar empresa: ' || SQLERRM;
      RETURN QUERY SELECT NULL::uuid, FALSE, 'Erro ao criar empresa: ' || SQLERRM, step_message;
      RETURN;
  END;

  -- Criar relação user_company
  BEGIN
    INSERT INTO public.user_company_relations (
      user_id, 
      company_id, 
      role
    )
    VALUES (_owner_id, new_company_id, 'admin')
    ON CONFLICT (user_id, company_id) DO UPDATE SET
      role = 'admin',
      updated_at = now();
      
    step_message := step_message || ' | Relacao user_company criada';
    
  EXCEPTION
    WHEN OTHERS THEN
      step_message := step_message || ' | ERRO ao criar relacao: ' || SQLERRM;
      RETURN QUERY SELECT new_company_id, FALSE, 'Erro ao criar relação: ' || SQLERRM, step_message;
      RETURN;
  END;

  -- Verificar perfil startup_hub existente
  SELECT COUNT(*) INTO existing_profile_count
  FROM public.startup_hub_profiles shp
  WHERE shp.user_id = _owner_id AND shp.status = 'active';

  step_message := step_message || ' | Perfis existentes: ' || existing_profile_count::text;

  -- Criar perfil startup se necessário
  IF existing_profile_count = 0 THEN
    BEGIN
      INSERT INTO public.startup_hub_profiles (
        user_id, 
        type, 
        status
      )
      VALUES (_owner_id, 'startup'::startup_hub_profile_type, 'active')
      ON CONFLICT (user_id) DO UPDATE SET
        type = 'startup'::startup_hub_profile_type,
        status = 'active',
        updated_at = now();
        
      step_message := step_message || ' | Perfil startup criado';
      
    EXCEPTION
      WHEN OTHERS THEN
        step_message := step_message || ' | ERRO ao criar perfil: ' || SQLERRM;
        RETURN QUERY SELECT new_company_id, FALSE, 'Erro ao criar perfil: ' || SQLERRM, step_message;
        RETURN;
    END;
  END IF;

  step_message := step_message || ' | Sucesso completo';
  
  -- Retornar sucesso
  RETURN QUERY SELECT new_company_id, TRUE, 'Empresa startup criada com sucesso'::text, step_message;
  RETURN;

EXCEPTION
  WHEN OTHERS THEN
    step_message := step_message || ' | ERRO GERAL: ' || SQLERRM;
    RETURN QUERY SELECT NULL::uuid, FALSE, 'Erro geral: ' || SQLERRM, step_message;
    RETURN;
END;
$$;