-- Registrar módulo OKR Execution em system_modules
INSERT INTO public.system_modules (name, slug, description, icon, active)
VALUES (
  'OKR Execution',
  'okr-execution',
  'Gestão de OKRs (Objectives and Key Results) com planejamento anual, trimestral e backlog de iniciativas',
  'Target',
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  active = EXCLUDED.active,
  updated_at = now();