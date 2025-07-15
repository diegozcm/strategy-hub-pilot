-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR NOT NULL UNIQUE,
  value JSONB,
  description TEXT,
  category VARCHAR DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system settings (only admins can manage)
CREATE POLICY "Admins can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create system settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update system settings" 
ON public.system_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete system settings" 
ON public.system_settings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
('app_name', '"Sistema de Gestão Estratégica"', 'Nome da aplicação', 'general'),
('company_registration_enabled', 'true', 'Permitir registro de novas empresas', 'registration'),
('user_registration_enabled', 'true', 'Permitir registro de novos usuários', 'registration'),
('email_notifications_enabled', 'true', 'Habilitar notificações por email', 'notifications'),
('maintenance_mode', 'false', 'Modo de manutenção do sistema', 'general'),
('max_users_per_company', '100', 'Máximo de usuários por empresa', 'limits'),
('session_timeout_minutes', '60', 'Timeout da sessão em minutos', 'security'),
('password_min_length', '8', 'Comprimento mínimo da senha', 'security'),
('backup_frequency_hours', '24', 'Frequência de backup em horas', 'maintenance');