-- Add logout_time column to user_login_logs
ALTER TABLE public.user_login_logs
ADD COLUMN logout_time TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster queries on active sessions
CREATE INDEX idx_user_login_logs_active_sessions 
ON public.user_login_logs(logout_time) 
WHERE logout_time IS NULL;