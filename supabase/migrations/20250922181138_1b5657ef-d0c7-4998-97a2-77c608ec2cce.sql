-- Insert default button configuration data
INSERT INTO public.landing_page_content (section_name, content_key, content_type, content_value, display_order, created_by, updated_by) VALUES
-- Button links
('hero', 'primary_button_link', 'text', '/auth', 11, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('hero', 'secondary_button_link', 'text', 'https://wa.me//554796342353?text=Tenho%20interesse%20em%20saber%20mais%20sobre%20o%20Start%20Together%20by%20COFOUND', 12, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- Button visibility controls
('hero', 'primary_button_active', 'text', 'true', 13, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('hero', 'secondary_button_active', 'text', 'true', 14, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')

ON CONFLICT (section_name, content_key) DO NOTHING;