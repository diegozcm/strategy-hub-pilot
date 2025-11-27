-- Migration: Update strategic_plans status constraint to allow only 'active' and 'inactive'

-- 1. First, update all existing plans with old statuses to 'inactive'
UPDATE strategic_plans 
SET status = 'inactive' 
WHERE status IN ('draft', 'completed', 'cancelled', 'paused');

-- 2. Drop the old constraint
ALTER TABLE strategic_plans 
DROP CONSTRAINT IF EXISTS strategic_plans_status_check;

-- 3. Create new constraint with only two allowed statuses
ALTER TABLE strategic_plans 
ADD CONSTRAINT strategic_plans_status_check 
CHECK (status IN ('active', 'inactive'));