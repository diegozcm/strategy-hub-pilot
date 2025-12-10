-- Adicionar coluna weight na tabela key_results para cálculo de média ponderada
ALTER TABLE public.key_results 
ADD COLUMN weight INTEGER NOT NULL DEFAULT 1;

-- Comentário explicativo
COMMENT ON COLUMN public.key_results.weight IS 'Peso do KR para cálculo de média ponderada no progresso do objetivo (padrão: 1)';