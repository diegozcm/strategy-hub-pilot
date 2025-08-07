-- Create system_modules table
CREATE TABLE public.system_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_modules table for access control
CREATE TABLE public.user_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.system_modules(id) ON DELETE CASCADE,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Add current_module_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN current_module_id UUID REFERENCES public.system_modules(id);

-- Enable RLS
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_modules
CREATE POLICY "Anyone can view active modules" 
ON public.system_modules FOR SELECT 
USING (active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage modules" 
ON public.system_modules FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_modules
CREATE POLICY "Users can view their own module access" 
ON public.user_modules FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage user module access" 
ON public.user_modules FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Functions for module management
CREATE OR REPLACE FUNCTION public.get_user_modules(_user_id UUID)
RETURNS TABLE(module_id UUID, name VARCHAR, slug VARCHAR, description TEXT, icon VARCHAR)
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT sm.id, sm.name, sm.slug, sm.description, sm.icon
  FROM public.system_modules sm
  INNER JOIN public.user_modules um ON sm.id = um.module_id
  WHERE um.user_id = _user_id 
    AND um.active = true 
    AND sm.active = true;
$$;

CREATE OR REPLACE FUNCTION public.grant_module_access(_admin_id UUID, _user_id UUID, _module_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin has permission
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem conceder acesso a módulos';
  END IF;

  -- Insert or update access
  INSERT INTO public.user_modules (user_id, module_id, granted_by, active)
  VALUES (_user_id, _module_id, _admin_id, true)
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    active = true,
    granted_by = _admin_id,
    granted_at = now(),
    updated_at = now();

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_module_access(_admin_id UUID, _user_id UUID, _module_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin has permission
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem revogar acesso a módulos';
  END IF;

  -- Deactivate access
  UPDATE public.user_modules 
  SET active = false, updated_at = now()
  WHERE user_id = _user_id AND module_id = _module_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.switch_user_module(_user_id UUID, _module_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user has access to module
  IF NOT EXISTS(
    SELECT 1 FROM public.user_modules 
    WHERE user_id = _user_id AND module_id = _module_id AND active = true
  ) THEN
    RAISE EXCEPTION 'Usuário não tem acesso a este módulo';
  END IF;

  -- Update current module
  UPDATE public.profiles 
  SET current_module_id = _module_id, updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$$;

-- Insert initial modules
INSERT INTO public.system_modules (name, slug, description, icon) VALUES
('Planejamento Estratégico', 'strategic-planning', 'Módulo para gestão de planejamento estratégico, objetivos e indicadores', 'Target'),
('Startup HUB', 'startup-hub', 'Módulo para gestão de startups e processos de aceleração', 'Rocket');

-- Grant access to strategic planning module for all existing users
INSERT INTO public.user_modules (user_id, module_id, granted_by, active)
SELECT 
  p.user_id,
  (SELECT id FROM public.system_modules WHERE slug = 'strategic-planning'),
  NULL, -- System migration
  true
FROM public.profiles p
ON CONFLICT (user_id, module_id) DO NOTHING;

-- Set current module for existing users to strategic planning
UPDATE public.profiles 
SET current_module_id = (SELECT id FROM public.system_modules WHERE slug = 'strategic-planning')
WHERE current_module_id IS NULL;

-- Add trigger for updated_at
CREATE TRIGGER update_system_modules_updated_at
BEFORE UPDATE ON public.system_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_modules_updated_at
BEFORE UPDATE ON public.user_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();