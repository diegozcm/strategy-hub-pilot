import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BackupJob {
  id: string;
  admin_user_id: string;
  backup_type: 'full' | 'incremental' | 'selective' | 'schema_only';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  tables_included?: string[];
  total_tables: number;
  processed_tables: number;
  total_records: number;
  backup_size_bytes: number;
  compression_ratio?: number;
  start_time?: string;
  end_time?: string;
  error_message?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BackupFile {
  id: string;
  backup_job_id: string;
  file_path: string;
  file_name: string;
  file_size_bytes: number;
  table_name?: string;
  record_count?: number;
  checksum?: string;
  created_at: string;
}

export interface BackupSchedule {
  id: string;
  admin_user_id: string;
  schedule_name: string;
  backup_type: 'full' | 'incremental' | 'selective' | 'schema_only';
  cron_expression: string;
  tables_included?: string[];
  retention_days: number;
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  created_at: string;
  updated_at: string;
}

export const useBackupSystem = () => {
  const [loading, setLoading] = useState(false);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([]);
  const { toast } = useToast();

  // Load backup jobs
  const loadBackupJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBackupJobs(data || []);
    } catch (error) {
      console.error('Error loading backup jobs:', error);
      toast({
        title: "Erro ao carregar trabalhos de backup",
        description: "Não foi possível carregar o histórico de backups.",
        variant: "destructive",
      });
    }
  };

  // Load backup files
  const loadBackupFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_files')
        .select(`
          *,
          backup_jobs (
            backup_type,
            status,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackupFiles(data || []);
    } catch (error) {
      console.error('Error loading backup files:', error);
    }
  };

  // Load backup schedules
  const loadBackupSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackupSchedules(data || []);
    } catch (error) {
      console.error('Error loading backup schedules:', error);
    }
  };

  // Execute backup
  const executeBackup = async (params: {
    type: 'full' | 'incremental' | 'selective' | 'schema_only';
    tables?: string[];
    notes?: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-system', {
        body: params
      });

      if (error) throw error;

      toast({
        title: "Backup iniciado com sucesso",
        description: `Backup ${params.type} foi iniciado. ID: ${data.backup_id}`,
        variant: "default",
      });

      // Reload data
      await loadBackupJobs();
      await loadBackupFiles();

      return data;
    } catch (error: any) {
      console.error('Error executing backup:', error);
      toast({
        title: "Erro ao executar backup",
        description: error.message || "Falha ao executar o backup.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Download backup file
  const downloadBackup = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('system-backups')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: `Arquivo ${fileName} está sendo baixado.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error downloading backup:', error);
      toast({
        title: "Erro no download",
        description: error.message || "Falha ao baixar o arquivo de backup.",
        variant: "destructive",
      });
    }
  };

  // Delete backup
  const deleteBackup = async (backupId: string) => {
    try {
      // Get associated files first
      const { data: files } = await supabase
        .from('backup_files')
        .select('file_path')
        .eq('backup_job_id', backupId);

      // Delete files from storage
      if (files && files.length > 0) {
        const filePaths = files.map(f => f.file_path);
        await supabase.storage
          .from('system-backups')
          .remove(filePaths);
      }

      // Delete backup job (cascade will handle backup_files)
      const { error } = await supabase
        .from('backup_jobs')
        .delete()
        .eq('id', backupId);

      if (error) throw error;

      toast({
        title: "Backup excluído",
        description: "Backup e arquivos associados foram removidos.",
        variant: "default",
      });

      // Reload data
      await loadBackupJobs();
      await loadBackupFiles();
    } catch (error: any) {
      console.error('Error deleting backup:', error);
      toast({
        title: "Erro ao excluir backup",
        description: error.message || "Falha ao excluir o backup.",
        variant: "destructive",
      });
    }
  };

  // Create backup schedule
  const createBackupSchedule = async (schedule: Omit<BackupSchedule, 'id' | 'admin_user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('backup_schedules')
        .insert({
          ...schedule,
          admin_user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Agendamento criado",
        description: `Backup automático "${schedule.schedule_name}" foi configurado.`,
        variant: "default",
      });

      await loadBackupSchedules();
    } catch (error: any) {
      console.error('Error creating backup schedule:', error);
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Falha ao criar o agendamento de backup.",
        variant: "destructive",
      });
    }
  };

  // Update backup schedule
  const updateBackupSchedule = async (scheduleId: string, updates: Partial<BackupSchedule>) => {
    try {
      const { error } = await supabase
        .from('backup_schedules')
        .update(updates)
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Agendamento atualizado",
        description: "Configurações do backup automático foram salvas.",
        variant: "default",
      });

      await loadBackupSchedules();
    } catch (error: any) {
      console.error('Error updating backup schedule:', error);
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message || "Falha ao atualizar o agendamento.",
        variant: "destructive",
      });
    }
  };

  // Delete backup schedule
  const deleteBackupSchedule = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('backup_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Agendamento excluído",
        description: "Backup automático foi removido.",
        variant: "default",
      });

      await loadBackupSchedules();
    } catch (error: any) {
      console.error('Error deleting backup schedule:', error);
      toast({
        title: "Erro ao excluir agendamento",
        description: error.message || "Falha ao excluir o agendamento.",
        variant: "destructive",
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // Load initial data
  useEffect(() => {
    loadBackupJobs();
    loadBackupFiles();
    loadBackupSchedules();
  }, []);

  return {
    loading,
    backupJobs,
    backupFiles,
    backupSchedules,
    executeBackup,
    downloadBackup,
    deleteBackup,
    createBackupSchedule,
    updateBackupSchedule,
    deleteBackupSchedule,
    loadBackupJobs,
    loadBackupFiles,
    loadBackupSchedules,
    formatFileSize,
    getStatusColor
  };
};