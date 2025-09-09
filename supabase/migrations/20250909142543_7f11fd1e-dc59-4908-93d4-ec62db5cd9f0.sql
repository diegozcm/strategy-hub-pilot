-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job to run scheduled backups every minute
SELECT cron.schedule(
  'scheduled-backups-check',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://pdpzxjlnaqwlyqoyoyhr.supabase.co/functions/v1/scheduled-backup',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHp4amxuYXF3bHlxb3lveWhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI1MTU4NiwiZXhwIjoyMDY3ODI3NTg2fQ.lJgPx5dRZO8FLO2_lYqFI2kEb_BhixCCJdNYzb_jVUY"}'::jsonb,
    body := '{"timestamp": "' || now() || '"}'::jsonb
  );
  $$
);

-- Add helper function to get table names (used by backup function)
CREATE OR REPLACE FUNCTION public.get_table_names()
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT array_agg(table_name::text)
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE '%_old'
    AND table_name NOT LIKE '%_backup'
    AND table_name NOT LIKE 'pg_%'
    AND table_name != 'spatial_ref_sys';
$$;