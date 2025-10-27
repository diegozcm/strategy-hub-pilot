-- Enable pg_net extension for HTTP calls from PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres, anon, authenticated, service_role;

-- Recreate the scheduled backup cron job with correct JSON syntax
SELECT cron.unschedule('scheduled-backups-check');

SELECT cron.schedule(
  'scheduled-backups-check',
  '* * * * *', -- Every minute to check for scheduled backups
  $$
  SELECT net.http_post(
    url := 'https://pdpzxjlnaqwlyqoyoyhr.supabase.co/functions/v1/scheduled-backup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHp4amxuYXF3bHlxb3lveWhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI1MTU4NiwiZXhwIjoyMDY3ODI3NTg2fQ.lJgPx5dRZO8FLO2_lYqFI2kEb_BhixCCJdNYzb_jVUY'
    ),
    body := jsonb_build_object('timestamp', now())
  ) as request_id;
  $$
);