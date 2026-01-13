-- Atualizar tabela de produção
UPDATE landing_page_content 
SET content_value = REPLACE(content_value, 'Start Together', 'Strategy HUB'),
    updated_at = now()
WHERE content_value LIKE '%Start Together%';

-- Atualizar tabela de rascunho
UPDATE landing_page_content_draft 
SET content_value = REPLACE(content_value, 'Start Together', 'Strategy HUB'),
    updated_at = now()
WHERE content_value LIKE '%Start Together%';