-- Add position column to kr_initiatives for drag-and-drop ordering
ALTER TABLE kr_initiatives ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing initiatives with positions based on creation order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY key_result_id ORDER BY created_at) - 1 as pos
  FROM kr_initiatives
)
UPDATE kr_initiatives SET position = ranked.pos
FROM ranked WHERE kr_initiatives.id = ranked.id;