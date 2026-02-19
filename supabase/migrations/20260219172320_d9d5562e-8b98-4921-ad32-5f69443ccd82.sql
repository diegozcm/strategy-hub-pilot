
-- Create public bucket for release images
INSERT INTO storage.buckets (id, name, public)
VALUES ('release-images', 'release-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read release images"
ON storage.objects FOR SELECT
USING (bucket_id = 'release-images');

-- Allow admins to upload
CREATE POLICY "Admins upload release images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'release-images' AND public.is_system_admin(auth.uid()));

-- Allow admins to delete
CREATE POLICY "Admins delete release images"
ON storage.objects FOR DELETE
USING (bucket_id = 'release-images' AND public.is_system_admin(auth.uid()));
