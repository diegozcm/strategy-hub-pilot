-- Reorganizar screenshots da landing page para seguir a ordem do sidebar

-- Screenshot 3: Alterar de "Dashboard Startup" para "OKRs Corporativos" (Strategy HUB)
UPDATE landing_page_content 
SET content_value = 'OKRs Corporativos'
WHERE section_name = 'demo' AND content_key = 'screenshot_3_title';

UPDATE landing_page_content 
SET content_value = 'Gestão de objetivos empresariais'
WHERE section_name = 'demo' AND content_key = 'screenshot_3_description';

UPDATE landing_page_content 
SET content_value = 'Strategy HUB'
WHERE section_name = 'demo' AND content_key = 'screenshot_3_module';

-- Screenshot 4: Alterar de "Avaliação BEEP" para "Resultados Chave" (Strategy HUB)
UPDATE landing_page_content 
SET content_value = 'Resultados Chave'
WHERE section_name = 'demo' AND content_key = 'screenshot_4_title';

UPDATE landing_page_content 
SET content_value = 'Indicadores e métricas estratégicas'
WHERE section_name = 'demo' AND content_key = 'screenshot_4_description';

UPDATE landing_page_content 
SET content_value = 'Strategy HUB'
WHERE section_name = 'demo' AND content_key = 'screenshot_4_module';

-- Screenshot 5: Alterar de "Mentoria COFOUND" para "Copiloto Estratégico IA" (Strategy HUB)
UPDATE landing_page_content 
SET content_value = 'Copiloto Estratégico IA'
WHERE section_name = 'demo' AND content_key = 'screenshot_5_title';

UPDATE landing_page_content 
SET content_value = 'Inteligência artificial para consultoria estratégica'
WHERE section_name = 'demo' AND content_key = 'screenshot_5_description';

UPDATE landing_page_content 
SET content_value = 'Strategy HUB'
WHERE section_name = 'demo' AND content_key = 'screenshot_5_module';

-- Screenshot 6: Alterar de "Copiloto IA" para "Dashboard Startup" (Startup HUB)
UPDATE landing_page_content 
SET content_value = 'Dashboard Startup'
WHERE section_name = 'demo' AND content_key = 'screenshot_6_title';

UPDATE landing_page_content 
SET content_value = 'Métricas BEEP em tempo real'
WHERE section_name = 'demo' AND content_key = 'screenshot_6_description';

UPDATE landing_page_content 
SET content_value = 'Startup HUB'
WHERE section_name = 'demo' AND content_key = 'screenshot_6_module';

-- Screenshot 7: Manter "Analytics BEEP" mas alterar para "Avaliação BEEP Completa" (Startup HUB)
UPDATE landing_page_content 
SET content_value = 'Avaliação BEEP Completa'
WHERE section_name = 'demo' AND content_key = 'screenshot_7_title';

UPDATE landing_page_content 
SET content_value = 'Business Entrepreneur Evolution Phases - 5 níveis de maturidade'
WHERE section_name = 'demo' AND content_key = 'screenshot_7_description';

-- Screenshot 8: Alterar de "OKRs" para "Analytics BEEP" (Startup HUB)
UPDATE landing_page_content 
SET content_value = 'Analytics BEEP'
WHERE section_name = 'demo' AND content_key = 'screenshot_8_title';

UPDATE landing_page_content 
SET content_value = 'Evolução e benchmarking das startups'
WHERE section_name = 'demo' AND content_key = 'screenshot_8_description';

UPDATE landing_page_content 
SET content_value = 'Startup HUB'
WHERE section_name = 'demo' AND content_key = 'screenshot_8_module';