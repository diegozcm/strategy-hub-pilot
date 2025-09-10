-- Add aggregation_type column to key_results table
ALTER TABLE public.key_results 
ADD COLUMN aggregation_type VARCHAR(20) DEFAULT 'sum';

-- Add check constraint to ensure valid values
ALTER TABLE public.key_results 
ADD CONSTRAINT key_results_aggregation_type_check 
CHECK (aggregation_type IN ('sum', 'average', 'max', 'min'));

-- Create an index for better performance on aggregation_type queries
CREATE INDEX idx_key_results_aggregation_type ON public.key_results(aggregation_type);