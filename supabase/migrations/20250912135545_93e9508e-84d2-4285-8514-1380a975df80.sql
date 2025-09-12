-- Criar bucket para logos de empresas
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

-- Políticas RLS para o bucket company-logos
-- Usuários podem visualizar logos de empresas que têm acesso
CREATE POLICY "Users can view company logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'company-logos' 
  AND EXISTS (
    SELECT 1 FROM public.user_company_relations ucr
    JOIN public.companies c ON c.id = ucr.company_id
    WHERE ucr.user_id = auth.uid()
    AND c.logo_url LIKE '%' || storage.objects.name || '%'
  )
);

-- Usuários podem fazer upload de logos para suas empresas
CREATE POLICY "Users can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND EXISTS (
    SELECT 1 FROM public.user_company_relations ucr
    WHERE ucr.user_id = auth.uid()
  )
);

-- Usuários podem atualizar logos de suas empresas  
CREATE POLICY "Users can update company logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 FROM public.user_company_relations ucr
    JOIN public.companies c ON c.id = ucr.company_id
    WHERE ucr.user_id = auth.uid()
    AND c.logo_url LIKE '%' || storage.objects.name || '%'
  )
);

-- Usuários podem deletar logos de suas empresas
CREATE POLICY "Users can delete company logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 FROM public.user_company_relations ucr
    JOIN public.companies c ON c.id = ucr.company_id
    WHERE ucr.user_id = auth.uid()
    AND c.logo_url LIKE '%' || storage.objects.name || '%'
  )
);