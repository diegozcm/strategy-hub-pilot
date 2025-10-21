-- Add target_direction column to key_results table
ALTER TABLE key_results 
ADD COLUMN target_direction VARCHAR(10) DEFAULT 'maximize' CHECK (target_direction IN ('maximize', 'minimize'));

COMMENT ON COLUMN key_results.target_direction IS 'Defines whether higher values are better (maximize) or lower values are better (minimize)';