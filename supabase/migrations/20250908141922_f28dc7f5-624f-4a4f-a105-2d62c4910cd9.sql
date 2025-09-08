-- Create backup system tables and storage bucket
CREATE TYPE backup_type AS ENUM ('full', 'incremental', 'selective', 'schema_only');
CREATE TYPE backup_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE restore_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- Backup jobs table
CREATE TABLE public.backup_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  backup_type backup_type NOT NULL DEFAULT 'full',
  status backup_status NOT NULL DEFAULT 'pending',
  tables_included TEXT[],
  total_tables INTEGER DEFAULT 0,
  processed_tables INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  backup_size_bytes BIGINT DEFAULT 0,
  compression_ratio DECIMAL(5,2),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Backup files table
CREATE TABLE public.backup_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_job_id UUID NOT NULL REFERENCES backup_jobs(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  table_name TEXT,
  record_count INTEGER,
  checksum TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Backup schedules table
CREATE TABLE public.backup_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  schedule_name TEXT NOT NULL,
  backup_type backup_type NOT NULL DEFAULT 'full',
  cron_expression TEXT NOT NULL,
  tables_included TEXT[],
  retention_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Backup restore logs table
CREATE TABLE public.backup_restore_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_job_id UUID NOT NULL REFERENCES backup_jobs(id),
  admin_user_id UUID NOT NULL,
  restore_type TEXT NOT NULL,
  tables_restored TEXT[],
  status restore_status NOT NULL DEFAULT 'pending',
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  records_restored INTEGER DEFAULT 0,
  error_message TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all backup tables
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_restore_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for backup system (admin only)
CREATE POLICY "Admins can manage backup jobs" ON public.backup_jobs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage backup files" ON public.backup_files
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage backup schedules" ON public.backup_schedules
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage backup restore logs" ON public.backup_restore_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public) 
VALUES ('system-backups', 'system-backups', false);

-- Create storage policies for backup bucket
CREATE POLICY "Admins can view backup files" ON storage.objects
  FOR SELECT USING (bucket_id = 'system-backups' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can upload backup files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'system-backups' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update backup files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'system-backups' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete backup files" ON storage.objects
  FOR DELETE USING (bucket_id = 'system-backups' AND has_role(auth.uid(), 'admin'::app_role));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_backup_jobs_updated_at
  BEFORE UPDATE ON public.backup_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_backup_schedules_updated_at
  BEFORE UPDATE ON public.backup_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_backup_jobs_admin_user_id ON public.backup_jobs(admin_user_id);
CREATE INDEX idx_backup_jobs_status ON public.backup_jobs(status);
CREATE INDEX idx_backup_jobs_created_at ON public.backup_jobs(created_at DESC);
CREATE INDEX idx_backup_files_backup_job_id ON public.backup_files(backup_job_id);
CREATE INDEX idx_backup_schedules_admin_user_id ON public.backup_schedules(admin_user_id);
CREATE INDEX idx_backup_schedules_is_active ON public.backup_schedules(is_active);
CREATE INDEX idx_backup_restore_logs_backup_job_id ON public.backup_restore_logs(backup_job_id);