-- Fix strategic_objectives weight constraint issue
-- Remove existing constraint and add a new one with proper range
ALTER TABLE public.strategic_objectives 
DROP CONSTRAINT IF EXISTS strategic_objectives_weight_check;

-- Add new constraint that allows valid weight values (1-100)
ALTER TABLE public.strategic_objectives 
ADD CONSTRAINT strategic_objectives_weight_check 
CHECK (weight >= 1 AND weight <= 100);

-- Add default value for weight if not provided
ALTER TABLE public.strategic_objectives 
ALTER COLUMN weight SET DEFAULT 50;