-- Add comparison_type column to key_results
-- 'cumulative' = compares accumulated sum until current period
-- 'period' = compares only the specific period value
ALTER TABLE public.key_results 
ADD COLUMN IF NOT EXISTS comparison_type character varying DEFAULT 'cumulative';

-- Add comment explaining the field
COMMENT ON COLUMN public.key_results.comparison_type IS 'Tipo de comparação: cumulative (acumulado até o período) ou period (apenas o período específico)';