-- Adicionar coluna theme_preference na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN theme_preference character varying DEFAULT 'light';

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.profiles.theme_preference IS 'User theme preference: light, dark, or system';

-- Criar índice para melhor performance
CREATE INDEX idx_profiles_theme_preference ON public.profiles(theme_preference);