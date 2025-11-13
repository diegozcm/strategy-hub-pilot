-- =====================================================
-- MIGRATION: Atualizar informações de contato e redes sociais do rodapé
-- =====================================================

-- Função auxiliar para upsert (update ou insert)
CREATE OR REPLACE FUNCTION upsert_landing_content(
  p_section text,
  p_key text,
  p_value text,
  p_type text DEFAULT 'text',
  p_table text DEFAULT 'landing_page_content'
) RETURNS void AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Pega o primeiro usuário admin ou system user
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- Tenta atualizar
  EXECUTE format(
    'UPDATE %I SET content_value = $1, content_type = $2, updated_by = $3, updated_at = now()
     WHERE section_name = $4 AND content_key = $5',
    p_table
  ) USING p_value, p_type, v_user_id, p_section, p_key;
  
  -- Se não atualizou, insere
  IF NOT FOUND THEN
    EXECUTE format(
      'INSERT INTO %I (section_name, content_key, content_value, content_type, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $5)',
      p_table
    ) USING p_section, p_key, p_value, p_type, v_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ATUALIZAR REDES SOCIAIS
-- =====================================================

-- Instagram (substituindo Twitter)
SELECT upsert_landing_content('footer', 'instagram_url', 'https://instagram.com/cofoundbr', 'text', 'landing_page_content');
SELECT upsert_landing_content('footer', 'instagram_url', 'https://instagram.com/cofoundbr', 'text', 'landing_page_content_draft');

-- LinkedIn atualizado
SELECT upsert_landing_content('footer', 'linkedin_url', 'https://www.linkedin.com/company/cofoundbr/', 'text', 'landing_page_content');
SELECT upsert_landing_content('footer', 'linkedin_url', 'https://www.linkedin.com/company/cofoundbr/', 'text', 'landing_page_content_draft');

-- Remover Twitter (marcando como inativo)
UPDATE landing_page_content 
SET is_active = false 
WHERE section_name = 'footer' AND content_key = 'twitter_url';

UPDATE landing_page_content_draft 
SET is_active = false 
WHERE section_name = 'footer' AND content_key = 'twitter_url';

-- =====================================================
-- ATUALIZAR INFORMAÇÕES DE CONTATO
-- =====================================================

-- Email
SELECT upsert_landing_content('footer', 'email', 'admin@cofound.com.br', 'text', 'landing_page_content');
SELECT upsert_landing_content('footer', 'email', 'admin@cofound.com.br', 'text', 'landing_page_content_draft');

-- Telefone
SELECT upsert_landing_content('footer', 'phone', '+55 48 3363-3549', 'text', 'landing_page_content');
SELECT upsert_landing_content('footer', 'phone', '+55 48 3363-3549', 'text', 'landing_page_content_draft');

-- Endereço
SELECT upsert_landing_content('footer', 'address', 'Ágora Tech Park - Joinville - SC - Brasil', 'text', 'landing_page_content');
SELECT upsert_landing_content('footer', 'address', 'Ágora Tech Park - Joinville - SC - Brasil', 'text', 'landing_page_content_draft');

-- =====================================================
-- REMOVER/DESATIVAR LINKS DE SUPORTE
-- =====================================================

-- Desativar links da coluna Suporte
UPDATE landing_page_content 
SET is_active = false 
WHERE section_name = 'footer' AND content_key IN (
  'help_center_url',
  'documentation_url',
  'column_3_title',
  'column_3_link_1_text',
  'column_3_link_1_url',
  'column_3_link_2_text',
  'column_3_link_2_url',
  'column_3_link_3_text',
  'column_3_link_3_url'
);

UPDATE landing_page_content_draft 
SET is_active = false 
WHERE section_name = 'footer' AND content_key IN (
  'help_center_url',
  'documentation_url',
  'column_3_title',
  'column_3_link_1_text',
  'column_3_link_1_url',
  'column_3_link_2_text',
  'column_3_link_2_url',
  'column_3_link_3_text',
  'column_3_link_3_url'
);

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS upsert_landing_content;