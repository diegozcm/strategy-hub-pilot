-- Add position column for ordering tasks within columns
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Initialize positions based on creation date (partition by status)
WITH ranked AS (
  SELECT id, status, ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at) - 1 as pos
  FROM project_tasks
)
UPDATE project_tasks 
SET position = ranked.pos 
FROM ranked 
WHERE project_tasks.id = ranked.id;