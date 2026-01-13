
-- =====================================================
-- FIX: Cleanup orphaned backup jobs and reset schedule
-- =====================================================

-- 1. Mark all stuck 'running' jobs as 'failed'
UPDATE backup_jobs 
SET 
  status = 'failed', 
  error_message = 'Upload failed due to special characters in filename - automatically cleaned up',
  end_time = NOW()
WHERE status = 'running' 
  AND created_at < NOW() - INTERVAL '5 minutes';

-- 2. Update next_run to the future to stop the infinite loop
UPDATE backup_schedules 
SET 
  next_run = (NOW() AT TIME ZONE 'UTC' + INTERVAL '1 day')::timestamptz,
  last_run = NOW(),
  updated_at = NOW()
WHERE schedule_name = 'Backup Diário';

-- 3. Ensure pg_cron and pg_net extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 4. Remove any existing scheduled-backups-check cron job if exists
SELECT cron.unschedule('scheduled-backups-check') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'scheduled-backups-check'
);

-- 5. Create new cron job with correct frequency (every 5 minutes instead of every minute)
SELECT cron.schedule(
  'scheduled-backups-check',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/scheduled-backup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object('timestamp', now())
  ) as request_id;
  $$
);
