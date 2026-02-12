
-- Add variation_threshold to key_results
ALTER TABLE public.key_results 
ADD COLUMN variation_threshold numeric DEFAULT NULL;

-- Add linked update columns to kr_fca
ALTER TABLE public.kr_fca
ADD COLUMN linked_update_month varchar DEFAULT NULL,
ADD COLUMN linked_update_value numeric DEFAULT NULL;
