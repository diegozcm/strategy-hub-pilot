-- Make assignee_id nullable to allow quick task creation without assigning
ALTER TABLE project_tasks 
  ALTER COLUMN assignee_id DROP NOT NULL;