-- Create storage bucket for landing page images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
SELECT 'landing-page', 'landing-page', true 
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'landing-page');

-- Create storage policies for landing page images
DO $$ 
BEGIN
  -- Public read access for landing page images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Landing page images are publicly accessible'
  ) THEN
    CREATE POLICY "Landing page images are publicly accessible" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'landing-page');
  END IF;

  -- Admin upload access for landing page images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Admins can upload landing page images'
  ) THEN
    CREATE POLICY "Admins can upload landing page images" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'landing-page' AND has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- Admin update access for landing page images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Admins can update landing page images'
  ) THEN
    CREATE POLICY "Admins can update landing page images" 
    ON storage.objects 
    FOR UPDATE 
    USING (bucket_id = 'landing-page' AND has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- Admin delete access for landing page images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Admins can delete landing page images'
  ) THEN
    CREATE POLICY "Admins can delete landing page images" 
    ON storage.objects 
    FOR DELETE 
    USING (bucket_id = 'landing-page' AND has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Add benefits section content fields
INSERT INTO public.landing_page_content (section_name, content_key, content_type, content_value, display_order, created_by, updated_by) VALUES
-- Benefits section header
('benefits', 'title', 'text', 'Resultados Comprovados', 1, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('benefits', 'subtitle', 'text', 'Transformação real no planejamento estratégico e aceleração de startups', 2, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- Metric 1
('benefits', 'metric_1_value', 'text', '90%', 3, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('benefits', 'metric_1_description', 'text', 'Das startups melhoram seu score BEEP em 6 meses', 4, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- Metric 2
('benefits', 'metric_2_value', 'text', '75%', 5, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('benefits', 'metric_2_description', 'text', 'Redução no tempo de planejamento estratégico', 6, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- Metric 3
('benefits', 'metric_3_value', 'text', '200+', 7, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('benefits', 'metric_3_description', 'text', 'Sessões de mentoria realizadas mensalmente', 8, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- Metric 4
('benefits', 'metric_4_value', 'text', '300%', 9, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('benefits', 'metric_4_description', 'text', 'ROI médio para empresas em planejamento estratégico', 10, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')

ON CONFLICT (section_name, content_key) DO NOTHING;