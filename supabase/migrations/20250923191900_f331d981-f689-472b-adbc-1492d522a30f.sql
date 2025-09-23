-- Allow public users to view active landing page content
CREATE POLICY "Public can view active landing page content"
ON public.landing_page_content
FOR SELECT
USING (is_active = true);