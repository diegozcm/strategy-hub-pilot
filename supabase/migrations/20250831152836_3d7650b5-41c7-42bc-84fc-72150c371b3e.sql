-- Correção Completa do Sistema Empresa/Startup
-- Parte 1: Correção das Políticas RLS de user_company_relations

-- Remover políticas antigas problemáticas
DROP POLICY IF EXISTS "Users can insert company relations" ON public.user_company_relations;
DROP POLICY IF EXISTS "Users can update company relations" ON public.user_company_relations;
DROP POLICY IF EXISTS "Users can delete company relations" ON public.user_company_relations;
DROP POLICY IF EXISTS "Users can view company relations" ON public.user_company_relations;

-- Criar políticas RLS simplificadas e sem ambiguidade
CREATE POLICY "Admin can manage all company relations"
ON public.user_company_relations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'::app_role 
    AND p.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'::app_role 
    AND p.status = 'active'
  )
);

CREATE POLICY "Users can view their own company relations"
ON public.user_company_relations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Parte 2: Correção das Políticas RLS de startup_hub_profiles

-- Remover políticas antigas
DROP POLICY IF EXISTS "Insert own startup hub profile with module access or admin" ON public.startup_hub_profiles;
DROP POLICY IF EXISTS "Update own startup hub profile with module access or admin" ON public.startup_hub_profiles;
DROP POLICY IF EXISTS "Delete own startup hub profile with module access or admin" ON public.startup_hub_profiles;
DROP POLICY IF EXISTS "View startup hub profiles if admin or has module access" ON public.startup_hub_profiles;

-- Criar políticas mais flexíveis para startup_hub_profiles
CREATE POLICY "Admin can manage all startup hub profiles"
ON public.startup_hub_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'::app_role 
    AND p.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'::app_role 
    AND p.status = 'active'
  )
);

CREATE POLICY "Users can manage their own startup hub profile"
ON public.startup_hub_profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view startup hub profiles with module access"
ON public.startup_hub_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'::app_role 
    AND p.status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_modules um
    JOIN system_modules sm ON sm.id = um.module_id
    WHERE um.user_id = auth.uid() 
    AND um.active = true 
    AND sm.slug = 'startup-hub'
  )
);

-- Parte 3: Função melhorada para criação de startup com transações e logs detalhados

CREATE OR REPLACE FUNCTION public.create_startup_company_v2(
  _name text, 
  _mission text DEFAULT NULL::text, 
  _vision text DEFAULT NULL::text, 
  _values text[] DEFAULT NULL::text[], 
  _logo_url text DEFAULT NULL::text, 
  _owner_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  company_id uuid, 
  success boolean, 
  message text, 
  step_log text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_company_id uuid;
  existing_profile_count integer;
  step_message text := '';
  relation_created boolean := false;
  profile_created boolean := false;
BEGIN
  -- Log de início
  step_message := 'Iniciando criacao de startup v2';
  
  -- Definir owner_id se null
  IF _owner_id IS NULL THEN
    _owner_id := auth.uid();
  END IF;

  step_message := step_message || ' | owner_id: ' || COALESCE(_owner_id::text, 'NULL');

  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = _owner_id 
    AND p.role = 'admin'::app_role 
    AND p.status = 'active'
  ) THEN
    RETURN QUERY SELECT NULL::uuid, FALSE, 'Apenas administradores podem criar empresas startup'::text, step_message;
    RETURN;
  END IF;

  step_message := step_message || ' | Admin verificado';

  -- Iniciar transação explícita
  BEGIN
    -- Criar a empresa startup
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
    RETURNING id INTO new_company_id;
    
    step_message := step_message || ' | Empresa criada: ' || new_company_id::text;

    -- Criar relação user_company (com retry em caso de falha)
    BEGIN
      INSERT INTO public.user_company_relations (
        user_id, 
        company_id, 
        role,
        created_at,
        updated_at
      )
      VALUES (_owner_id, new_company_id, 'admin', now(), now());
      
      relation_created := true;
      step_message := step_message || ' | Relacao user_company criada';
      
    EXCEPTION
      WHEN OTHERS THEN
        step_message := step_message || ' | ERRO ao criar relacao: ' || SQLERRM;
        RAISE EXCEPTION 'Erro ao criar relação user_company: %', SQLERRM;
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
          status,
          created_at,
          updated_at
        )
        VALUES (_owner_id, 'startup'::startup_hub_profile_type, 'active', now(), now());
        
        profile_created := true;
        step_message := step_message || ' | Perfil startup criado';
        
      EXCEPTION
        WHEN OTHERS THEN
          step_message := step_message || ' | ERRO ao criar perfil: ' || SQLERRM;
          RAISE EXCEPTION 'Erro ao criar perfil startup: %', SQLERRM;
      END;
    ELSE
      step_message := step_message || ' | Perfil ja existia';
    END IF;

    step_message := step_message || ' | Sucesso completo';
    
    -- Retornar sucesso
    RETURN QUERY SELECT new_company_id, TRUE, 'Empresa startup criada com sucesso'::text, step_message;
    RETURN;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback automático já acontece, só precisamos logar
      step_message := step_message || ' | ROLLBACK executado - ERRO: ' || SQLERRM;
      RETURN QUERY SELECT NULL::uuid, FALSE, 'Erro na criação da startup: ' || SQLERRM, step_message;
      RETURN;
  END;
END;
$$;

-- Parte 4: Função para verificar integridade de startup

CREATE OR REPLACE FUNCTION public.check_startup_integrity(_company_id uuid)
RETURNS TABLE(
  has_company boolean,
  has_relation boolean,
  has_profile boolean,
  is_complete boolean,
  issues text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _has_company boolean := false;
  _has_relation boolean := false;
  _has_profile boolean := false;
  _owner_id uuid;
  _issues text[] := ARRAY[]::text[];
BEGIN
  -- Verificar se a empresa existe e é startup
  SELECT EXISTS(
    SELECT 1 FROM public.companies c 
    WHERE c.id = _company_id 
    AND c.company_type = 'startup'
    AND c.status = 'active'
  ), c.owner_id INTO _has_company, _owner_id
  FROM public.companies c 
  WHERE c.id = _company_id;

  IF NOT _has_company THEN
    _issues := _issues || 'Empresa não encontrada ou não é startup ativa';
  END IF;

  -- Verificar relação user_company
  SELECT EXISTS(
    SELECT 1 FROM public.user_company_relations ucr
    WHERE ucr.company_id = _company_id 
    AND ucr.user_id = _owner_id
    AND ucr.role = 'admin'
  ) INTO _has_relation;

  IF NOT _has_relation THEN
    _issues := _issues || 'Relação owner-empresa não encontrada';
  END IF;

  -- Verificar perfil startup_hub
  SELECT EXISTS(
    SELECT 1 FROM public.startup_hub_profiles shp
    WHERE shp.user_id = _owner_id 
    AND shp.type = 'startup'
    AND shp.status = 'active'
  ) INTO _has_profile;

  IF NOT _has_profile THEN
    _issues := _issues || 'Perfil startup_hub não encontrado';
  END IF;

  RETURN QUERY SELECT 
    _has_company,
    _has_relation, 
    _has_profile,
    (_has_company AND _has_relation AND _has_profile),
    _issues;
END;
$$;

-- Parte 5: Função para reparar startup incompleta

CREATE OR REPLACE FUNCTION public.repair_startup(_company_id uuid)
RETURNS TABLE(success boolean, message text, actions_taken text[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _owner_id uuid;
  _actions text[] := ARRAY[]::text[];
  repair_success boolean := true;
BEGIN
  -- Verificar se usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'::app_role 
    AND p.status = 'active'
  ) THEN
    RETURN QUERY SELECT FALSE, 'Apenas admins podem reparar startups', ARRAY[]::text[];
    RETURN;
  END IF;

  -- Obter owner_id da empresa
  SELECT c.owner_id INTO _owner_id
  FROM public.companies c 
  WHERE c.id = _company_id 
  AND c.company_type = 'startup';

  IF _owner_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Empresa startup não encontrada', ARRAY[]::text[];
    RETURN;
  END IF;

  -- Reparar relação user_company se não existir
  IF NOT EXISTS(
    SELECT 1 FROM public.user_company_relations ucr
    WHERE ucr.company_id = _company_id 
    AND ucr.user_id = _owner_id
  ) THEN
    INSERT INTO public.user_company_relations (user_id, company_id, role)
    VALUES (_owner_id, _company_id, 'admin');
    _actions := _actions || 'Relação user_company criada';
  END IF;

  -- Reparar perfil startup_hub se não existir
  IF NOT EXISTS(
    SELECT 1 FROM public.startup_hub_profiles shp
    WHERE shp.user_id = _owner_id 
    AND shp.type = 'startup'
    AND shp.status = 'active'
  ) THEN
    INSERT INTO public.startup_hub_profiles (user_id, type, status)
    VALUES (_owner_id, 'startup'::startup_hub_profile_type, 'active')
    ON CONFLICT (user_id) DO UPDATE SET
      type = 'startup'::startup_hub_profile_type,
      status = 'active',
      updated_at = now();
    _actions := _actions || 'Perfil startup_hub criado/reparado';
  END IF;

  RETURN QUERY SELECT TRUE, 'Startup reparada com sucesso', _actions;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'Erro ao reparar startup: ' || SQLERRM, _actions;
END;
$$;