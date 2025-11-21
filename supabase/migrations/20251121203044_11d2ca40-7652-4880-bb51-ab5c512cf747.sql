-- Adiciona o módulo OKR Planning ao sistema
INSERT INTO public.system_modules (name, slug, description, icon, active)
VALUES (
  'OKR Planning',
  'okr-planning',
  'Módulo de planejamento e execução de OKRs (Objectives and Key Results)',
  'Target',
  true
)
ON CONFLICT (slug) DO NOTHING;