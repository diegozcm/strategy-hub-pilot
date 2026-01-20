-- Criar bucket para imagens de capa de projetos
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-covers', 'project-covers', true);

-- Politica de leitura publica
CREATE POLICY "Leitura publica de capas de projeto"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-covers');

-- Politica de upload para usuarios autenticados
CREATE POLICY "Upload de capas para autenticados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-covers' AND auth.role() = 'authenticated');

-- Politica de atualizacao
CREATE POLICY "Atualizacao de capas para autenticados"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-covers' AND auth.role() = 'authenticated');

-- Politica de delecao
CREATE POLICY "Delecao de capas para autenticados"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-covers' AND auth.role() = 'authenticated');