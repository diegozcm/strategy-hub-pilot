-- Create landing page content management table
CREATE TABLE public.landing_page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_name VARCHAR(100) NOT NULL,
  content_key VARCHAR(100) NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('text', 'image', 'icon', 'json', 'array')),
  content_value TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_name, content_key)
);

-- Enable RLS
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can manage landing page content" 
ON public.landing_page_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_landing_page_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_landing_page_content_updated_at
BEFORE UPDATE ON public.landing_page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_landing_page_content_updated_at();

-- Create storage bucket for landing page images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('landing-page', 'landing-page', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for landing page images
CREATE POLICY "Admins can upload landing page images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'landing-page' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view landing page images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'landing-page');

CREATE POLICY "Admins can update landing page images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'landing-page' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete landing page images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'landing-page' AND has_role(auth.uid(), 'admin'::app_role));

-- Insert default content
INSERT INTO public.landing_page_content (section_name, content_key, content_type, content_value, display_order, created_by, updated_by) VALUES
-- Hero section
('hero', 'title', 'text', 'A primeira plataforma que unifica Strategy HUB e Startup HUB', 1, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('hero', 'subtitle', 'text', 'Transforme sua visão em resultados concretos com uma plataforma que acelera o crescimento do seu negócio e conecta startups aos melhores mentores do mercado.', 2, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('hero', 'primary_button', 'text', 'Começar Gratuitamente', 3, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('hero', 'secondary_button', 'text', 'Ver Demo', 4, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- Trust badges
('hero', 'badge_1_text', 'text', 'Estratégia', 5, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('hero', 'badge_1_icon', 'icon', 'Target', 6, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('hero', 'badge_2_text', 'text', 'Crescimento', 7, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('hero', 'badge_2_icon', 'icon', 'TrendingUp', 8, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('hero', 'badge_3_text', 'text', 'Aceleração', 9, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('hero', 'badge_3_icon', 'icon', 'Rocket', 10, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');