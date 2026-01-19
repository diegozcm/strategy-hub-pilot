-- Políticas para permitir que admins façam upload de avatares para qualquer usuário

-- Permitir que admins façam upload de avatar para qualquer usuário
CREATE POLICY "Admins can upload avatars for any user"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Permitir que admins atualizem avatares de qualquer usuário
CREATE POLICY "Admins can update avatars for any user"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Permitir que admins deletem avatares de qualquer usuário
CREATE POLICY "Admins can delete avatars for any user"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);