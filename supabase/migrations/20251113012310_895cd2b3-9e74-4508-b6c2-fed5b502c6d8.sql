-- Upsert Strategy HUB features into landing_page_content and landing_page_content_draft without relying on ON CONFLICT
-- Use a fixed system UUID for created_by/updated_by
DO $$
DECLARE
  sys_user uuid := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
  -- Helper procedure to update then insert if missing
  -- For landing_page_content
  -- Feature 1
  UPDATE landing_page_content
     SET content_value = 'Activity', content_type = 'text', display_order = 1, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_1_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_1_icon', 'Activity', 'text', 1, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'Dashboard RUMO', content_type = 'text', display_order = 1, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_1_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_1_title', 'Dashboard RUMO', 'text', 1, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'Visão executiva integrada com objetivos, pilares estratégicos e indicadores de desempenho em tempo real', content_type = 'text', display_order = 1, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_1_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_1_description', 'Visão executiva integrada com objetivos, pilares estratégicos e indicadores de desempenho em tempo real', 'text', 1, true, sys_user, sys_user);
  END IF;

  -- Feature 2
  UPDATE landing_page_content
     SET content_value = 'Map', content_type = 'text', display_order = 2, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_2_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_2_icon', 'Map', 'text', 2, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'Mapa Estratégico', content_type = 'text', display_order = 2, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_2_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_2_title', 'Mapa Estratégico', 'text', 2, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'Estruture e visualize pilares estratégicos, objetivos corporativos e resultados-chave em uma visão unificada', content_type = 'text', display_order = 2, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_2_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_2_description', 'Estruture e visualize pilares estratégicos, objetivos corporativos e resultados-chave em uma visão unificada', 'text', 2, true, sys_user, sys_user);
  END IF;

  -- Feature 3
  UPDATE landing_page_content
     SET content_value = 'Target', content_type = 'text', display_order = 3, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_3_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_3_icon', 'Target', 'text', 3, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'OKRs e Indicadores', content_type = 'text', display_order = 3, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_3_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_3_title', 'OKRs e Indicadores', 'text', 3, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'Defina objetivos, estabeleça key results mensuráveis e acompanhe o progresso com métricas detalhadas', content_type = 'text', display_order = 3, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_3_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_3_description', 'Defina objetivos, estabeleça key results mensuráveis e acompanhe o progresso com métricas detalhadas', 'text', 3, true, sys_user, sys_user);
  END IF;

  -- Feature 4
  UPDATE landing_page_content
     SET content_value = 'Briefcase', content_type = 'text', display_order = 4, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_4_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_4_icon', 'Briefcase', 'text', 4, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'Planos de Ação', content_type = 'text', display_order = 4, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_4_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_4_title', 'Planos de Ação', 'text', 4, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'Gerencie iniciativas estratégicas, projetos e ações com acompanhamento de responsáveis e prazos', content_type = 'text', display_order = 4, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_4_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_4_description', 'Gerencie iniciativas estratégicas, projetos e ações com acompanhamento de responsáveis e prazos', 'text', 4, true, sys_user, sys_user);
  END IF;

  -- Feature 5
  UPDATE landing_page_content
     SET content_value = 'Lightbulb', content_type = 'text', display_order = 5, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_5_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_5_icon', 'Lightbulb', 'text', 5, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'Ferramentas Estratégicas', content_type = 'text', display_order = 5, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_5_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_5_title', 'Ferramentas Estratégicas', 'text', 5, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'Análise SWOT, Golden Circle e Vision Alignment para fortalecer seu planejamento estratégico', content_type = 'text', display_order = 5, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_5_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_5_description', 'Análise SWOT, Golden Circle e Vision Alignment para fortalecer seu planejamento estratégico', 'text', 5, true, sys_user, sys_user);
  END IF;

  -- Feature 6
  UPDATE landing_page_content
     SET content_value = 'Brain', content_type = 'text', display_order = 6, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_6_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_6_icon', 'Brain', 'text', 6, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'Copiloto com IA', content_type = 'text', display_order = 6, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_6_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_6_title', 'Copiloto com IA', 'text', 6, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content
     SET content_value = 'Assistente inteligente que fornece insights, análises preditivas e recomendações estratégicas personalizadas', content_type = 'text', display_order = 6, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_6_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_6_description', 'Assistente inteligente que fornece insights, análises preditivas e recomendações estratégicas personalizadas', 'text', 6, true, sys_user, sys_user);
  END IF;

  -- Repeat for landing_page_content_draft
  -- Feature 1
  UPDATE landing_page_content_draft
     SET content_value = 'Activity', content_type = 'text', display_order = 1, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_1_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_1_icon', 'Activity', 'text', 1, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'Dashboard RUMO', content_type = 'text', display_order = 1, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_1_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_1_title', 'Dashboard RUMO', 'text', 1, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'Visão executiva integrada com objetivos, pilares estratégicos e indicadores de desempenho em tempo real', content_type = 'text', display_order = 1, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_1_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_1_description', 'Visão executiva integrada com objetivos, pilares estratégicos e indicadores de desempenho em tempo real', 'text', 1, true, sys_user, sys_user);
  END IF;

  -- Feature 2
  UPDATE landing_page_content_draft
     SET content_value = 'Map', content_type = 'text', display_order = 2, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_2_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_2_icon', 'Map', 'text', 2, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'Mapa Estratégico', content_type = 'text', display_order = 2, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_2_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_2_title', 'Mapa Estratégico', 'text', 2, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'Estruture e visualize pilares estratégicos, objetivos corporativos e resultados-chave em uma visão unificada', content_type = 'text', display_order = 2, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_2_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_2_description', 'Estruture e visualize pilares estratégicos, objetivos corporativos e resultados-chave em uma visão unificada', 'text', 2, true, sys_user, sys_user);
  END IF;

  -- Feature 3
  UPDATE landing_page_content_draft
     SET content_value = 'Target', content_type = 'text', display_order = 3, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_3_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_3_icon', 'Target', 'text', 3, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'OKRs e Indicadores', content_type = 'text', display_order = 3, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_3_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_3_title', 'OKRs e Indicadores', 'text', 3, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'Defina objetivos, estabeleça key results mensuráveis e acompanhe o progresso com métricas detalhadas', content_type = 'text', display_order = 3, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_3_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_3_description', 'Defina objetivos, estabeleça key results mensuráveis e acompanhe o progresso com métricas detalhadas', 'text', 3, true, sys_user, sys_user);
  END IF;

  -- Feature 4
  UPDATE landing_page_content_draft
     SET content_value = 'Briefcase', content_type = 'text', display_order = 4, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_4_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_4_icon', 'Briefcase', 'text', 4, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'Planos de Ação', content_type = 'text', display_order = 4, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_4_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_4_title', 'Planos de Ação', 'text', 4, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'Gerencie iniciativas estratégicas, projetos e ações com acompanhamento de responsáveis e prazos', content_type = 'text', display_order = 4, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_4_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_4_description', 'Gerencie iniciativas estratégicas, projetos e ações com acompanhamento de responsáveis e prazos', 'text', 4, true, sys_user, sys_user);
  END IF;

  -- Feature 5
  UPDATE landing_page_content_draft
     SET content_value = 'Lightbulb', content_type = 'text', display_order = 5, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_5_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_5_icon', 'Lightbulb', 'text', 5, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'Ferramentas Estratégicas', content_type = 'text', display_order = 5, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_5_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_5_title', 'Ferramentas Estratégicas', 'text', 5, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'Análise SWOT, Golden Circle e Vision Alignment para fortalecer seu planejamento estratégico', content_type = 'text', display_order = 5, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_5_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_5_description', 'Análise SWOT, Golden Circle e Vision Alignment para fortalecer seu planejamento estratégico', 'text', 5, true, sys_user, sys_user);
  END IF;

  -- Feature 6
  UPDATE landing_page_content_draft
     SET content_value = 'Brain', content_type = 'text', display_order = 6, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_6_icon';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_6_icon', 'Brain', 'text', 6, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'Copiloto com IA', content_type = 'text', display_order = 6, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_6_title';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_6_title', 'Copiloto com IA', 'text', 6, true, sys_user, sys_user);
  END IF;

  UPDATE landing_page_content_draft
     SET content_value = 'Assistente inteligente que fornece insights, análises preditivas e recomendações estratégicas personalizadas', content_type = 'text', display_order = 6, is_active = true, updated_by = sys_user, updated_at = now()
   WHERE section_name = 'features' AND content_key = 'strategy_feature_6_description';
  IF NOT FOUND THEN
    INSERT INTO landing_page_content_draft (section_name, content_key, content_value, content_type, display_order, is_active, created_by, updated_by)
    VALUES ('features', 'strategy_feature_6_description', 'Assistente inteligente que fornece insights, análises preditivas e recomendações estratégicas personalizadas', 'text', 6, true, sys_user, sys_user);
  END IF;
END $$;