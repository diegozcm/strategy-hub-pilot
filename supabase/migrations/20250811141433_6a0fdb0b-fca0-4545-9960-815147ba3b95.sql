
-- 1) Enum específico do módulo Startup HUB
CREATE TYPE public.startup_hub_profile_type AS ENUM ('startup', 'mentor');

-- 2) Tabela de perfis do Startup HUB (um por usuário)
CREATE TABLE public.startup_hub_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.startup_hub_profile_type NOT NULL,
  bio TEXT,
  areas_of_expertise TEXT[], -- usado principalmente para Mentor (lista de áreas)
  startup_name TEXT,         -- usado principalmente para Startup
  website TEXT,
  status VARCHAR NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 3) Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trg_startup_hub_profiles_updated_at
BEFORE UPDATE ON public.startup_hub_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Habilitar RLS
ALTER TABLE public.startup_hub_profiles ENABLE ROW LEVEL SECURITY;

-- 5) Políticas de acesso:
-- Helper: condição de acesso ao módulo "startup-hub"
-- Usaremos EXISTS sobre user_modules + system_modules (slug = 'startup-hub').

-- SELECT: Admins OU qualquer usuário com acesso ao módulo startup-hub
CREATE POLICY "View startup hub profiles if admin or has module access"
ON public.startup_hub_profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.user_modules um
    JOIN public.system_modules sm ON sm.id = um.module_id
    WHERE um.user_id = auth.uid()
      AND um.active = true
      AND sm.slug = 'startup-hub'
  )
);

-- INSERT: Admins OU o próprio usuário (auth.uid() = user_id) com acesso ao módulo
CREATE POLICY "Insert own startup hub profile with module access or admin"
ON public.startup_hub_profiles
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.user_modules um
      JOIN public.system_modules sm ON sm.id = um.module_id
      WHERE um.user_id = auth.uid()
        AND um.active = true
        AND sm.slug = 'startup-hub'
    )
  )
);

-- UPDATE: Admins OU o próprio usuário com acesso ao módulo
CREATE POLICY "Update own startup hub profile with module access or admin"
ON public.startup_hub_profiles
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.user_modules um
      JOIN public.system_modules sm ON sm.id = um.module_id
      WHERE um.user_id = auth.uid()
        AND um.active = true
        AND sm.slug = 'startup-hub'
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.user_modules um
      JOIN public.system_modules sm ON sm.id = um.module_id
      WHERE um.user_id = auth.uid()
        AND um.active = true
        AND sm.slug = 'startup-hub'
    )
  )
);

-- DELETE: Admins OU o próprio usuário com acesso ao módulo
CREATE POLICY "Delete own startup hub profile with module access or admin"
ON public.startup_hub_profiles
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.user_modules um
      JOIN public.system_modules sm ON sm.id = um.module_id
      WHERE um.user_id = auth.uid()
        AND um.active = true
        AND sm.slug = 'startup-hub'
    )
  )
);
