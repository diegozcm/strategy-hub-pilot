-- Create user login logs table
CREATE TABLE public.user_login_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_user_login_logs_login_time ON public.user_login_logs(login_time DESC);
CREATE INDEX idx_user_login_logs_user_id ON public.user_login_logs(user_id);

-- Enable RLS
ALTER TABLE public.user_login_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all login logs
CREATE POLICY "Admins can view all login logs"
  ON public.user_login_logs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Users can view their own login logs
CREATE POLICY "Users can view own login logs"
  ON public.user_login_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: System can create login logs
CREATE POLICY "System can create login logs"
  ON public.user_login_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);