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
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RestoreLog {
  id: string;
  backup_job_id: string;
  admin_user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'in_progress';
  restore_type: string;
  start_time?: string;
  end_time?: string;
  records_restored?: number;
  tables_restored?: string[];
  error_message?: string;
  notes?: string;
}

export const useBackupSystem = () => {
  const [loading, setLoading] = useState(false);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([]);
  const [restoreLogs, setRestoreLogs] = useState<RestoreLog[]>([]);
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

  // Load restore logs
  const loadRestoreLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_restore_logs')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) throw error;
      setRestoreLogs(data || []);
    } catch (error) {
      console.error('Error loading restore logs:', error);
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

  // Execute restore
  const executeRestore = async (params: {
    backupJobId: string;
    targetTables?: string[];
    conflictStrategy: 'replace' | 'skip' | 'merge';
    createBackupBeforeRestore: boolean;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('restore-system', {
        body: params
      });

      if (error) throw error;

      toast({
        title: "Restore executado com sucesso",
        description: data.message || "Dados restaurados com sucesso",
        variant: "default",
      });

      // Reload data
      await loadBackupJobs();
      await loadBackupFiles();
      await loadRestoreLogs();

      return data;
    } catch (error: any) {
      console.error('Error executing restore:', error);
      toast({
        title: "Erro ao executar restore",
        description: error.message || "Falha ao executar o restore.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Download backup file
  const downloadBackup = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('system-backups')
        .download(filePath);

      if (error) throw error;

      // Create download link with DOM safety
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      
      try {
        // Safe DOM manipulation with error handling
        if (document.body) {
          document.body.appendChild(a);
          a.click();
          
          // Safe removal with timeout to prevent race conditions
          setTimeout(() => {
            try {
              if (document.body.contains(a)) {
                document.body.removeChild(a);
              }
            } catch (removeError) {
              console.warn('Safe DOM cleanup - element already removed:', removeError);
            }
          }, 100);
        }
      } catch (domError) {
        console.error('DOM manipulation error during download:', domError);
        // Fallback: direct download without DOM manipulation
        const downloadUrl = URL.createObjectURL(data);
        window.open(downloadUrl, '_blank');
      } finally {
        // Always clean up URL
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

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

  // Calculate next run time based on cron expression
  const calculateNextRun = (cronExpression: string, lastRun?: string): Date => {
    const now = new Date();
    let nextRun = new Date(now);

    // Parse cron expression (minute hour day month dayofweek)
    const cronParts = cronExpression.split(' ');
    
    if (cronParts.length >= 5) {
      const minute = cronParts[0];
      const hour = cronParts[1];
      const day = cronParts[2];
      const month = cronParts[3];
      const dayOfWeek = cronParts[4];

      // Simple logic for common patterns
      if (minute === '0' && hour === '0' && day === '*') {
        // Daily at midnight
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(0, 0, 0, 0);
      } else if (minute === '0' && hour === '*') {
        // Every hour
        nextRun.setHours(nextRun.getHours() + 1);
        nextRun.setMinutes(0, 0, 0);
      } else if (minute === '*') {
        // Every minute
        nextRun.setMinutes(nextRun.getMinutes() + 1);
        nextRun.setSeconds(0, 0);
      } else if (minute === '0' && hour !== '*' && day === '*') {
        // Daily at specific hour
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(parseInt(hour), 0, 0, 0);
      } else {
        // Default: add 1 day
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else {
      // Default: add 1 day
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  };

  // Format cron expression for display
  const formatCronExpression = (cronExpression: string): string => {
    const cronParts = cronExpression.split(' ');
    
    if (cronParts.length >= 5) {
      const minute = cronParts[0];
      const hour = cronParts[1];
      const day = cronParts[2];
      const month = cronParts[3];
      const dayOfWeek = cronParts[4];

      if (minute === '0' && hour === '0' && day === '*') {
        return 'Diariamente à meia-noite';
      } else if (minute === '0' && hour === '*') {
        return 'A cada hora';
      } else if (minute === '*') {
        return 'A cada minuto';
      } else if (minute === '0' && hour !== '*' && day === '*') {
        return `Diariamente às ${hour}:00`;
      } else if (minute !== '*' && hour !== '*' && day === '*') {
        return `Diariamente às ${hour}:${minute.padStart(2, '0')}`;
      }
    }

    return cronExpression;
  };

  // Load initial data
  useEffect(() => {
    loadBackupJobs();
    loadBackupFiles();
    loadBackupSchedules();
    loadRestoreLogs();
  }, []);

  return {
    loading,
    backupJobs,
    backupFiles,
    backupSchedules,
    restoreLogs,
    executeBackup,
    executeRestore,
    downloadBackup,
    deleteBackup,
    createBackupSchedule,
    updateBackupSchedule,
    deleteBackupSchedule,
    loadBackupJobs,
    loadBackupFiles,
    loadBackupSchedules,
    loadRestoreLogs,
    formatFileSize,
    getStatusColor,
    calculateNextRun,
    formatCronExpression
  };
};