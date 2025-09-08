import React, { useState } from 'react';
import { useBackupSystem } from '@/hooks/useBackupSystem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Database, 
  Download, 
  Trash2, 
  Play, 
  Clock, 
  FileArchive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  HardDrive
} from 'lucide-react';

export const BackupTab: React.FC = () => {
  const {
    loading,
    backupJobs,
    backupFiles,
    backupSchedules,
    executeBackup,
    downloadBackup,
    deleteBackup,
    formatFileSize,
    getStatusColor
  } = useBackupSystem();

  const [backupType, setBackupType] = useState<'full' | 'incremental' | 'selective' | 'schema_only'>('full');
  const [backupNotes, setBackupNotes] = useState('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  // Available tables for selective backup
  const availableTables = [
    'companies', 'profiles', 'user_company_relations', 'user_roles', 'user_modules',
    'system_modules', 'system_settings', 'startup_hub_profiles', 'golden_circle',
    'swot_analysis', 'strategic_plans', 'strategic_projects', 'strategic_objectives',
    'key_results', 'key_result_values', 'beep_assessments', 'mentoring_sessions',
    'action_items', 'ai_insights', 'ai_recommendations'
  ];

  const handleExecuteBackup = async () => {
    try {
      await executeBackup({
        type: backupType,
        tables: backupType === 'selective' ? selectedTables : undefined,
        notes: backupNotes
      });
      setBackupNotes('');
    } catch (error) {
      console.error('Error executing backup:', error);
    }
  };

  const getBackupTypeLabel = (type: string) => {
    switch (type) {
      case 'full': return 'Completo';
      case 'incremental': return 'Incremental';
      case 'selective': return 'Seletivo';
      case 'schema_only': return 'Apenas Schema';
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Os backups são armazenados de forma segura e podem ser usados para restaurar dados em caso de perda. 
          Apenas administradores podem criar, baixar e gerenciar backups.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Criar Backup</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="schedules">Agendamentos</TabsTrigger>
        </TabsList>

        {/* Create Backup Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Criar Novo Backup
              </CardTitle>
              <CardDescription>
                Configure e execute um novo backup do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="backup-type">Tipo de Backup</Label>
                  <Select value={backupType} onValueChange={(value: any) => setBackupType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de backup" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Completo - Todas as tabelas com dados</SelectItem>
                      <SelectItem value="incremental">Incremental - Apenas dados modificados</SelectItem>
                      <SelectItem value="selective">Seletivo - Tabelas específicas</SelectItem>
                      <SelectItem value="schema_only">Apenas Schema - Estrutura das tabelas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {backupType === 'selective' && (
                  <div>
                    <Label>Tabelas para Backup (separadas por vírgula)</Label>
                    <Input
                      placeholder="Ex: companies, profiles, user_roles"
                      value={selectedTables.join(', ')}
                      onChange={(e) => setSelectedTables(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    />
                    <div className="mt-2 text-sm text-muted-foreground">
                      Tabelas disponíveis: {availableTables.join(', ')}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="backup-notes">Notas do Backup (opcional)</Label>
                  <Textarea
                    id="backup-notes"
                    placeholder="Adicione notas ou descrição para este backup..."
                    value={backupNotes}
                    onChange={(e) => setBackupNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleExecuteBackup} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executando Backup...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Executar Backup {getBackupTypeLabel(backupType)}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileArchive className="w-5 h-5" />
                Histórico de Backups
              </CardTitle>
              <CardDescription>
                Visualize, baixe e gerencie backups existentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backupJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum backup foi criado ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {backupJobs.map((job) => {
                    const associatedFiles = backupFiles.filter(f => f.backup_job_id === job.id);
                    
                    return (
                      <Card key={job.id} className="relative">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(job.status)}
                                <Badge variant="outline">
                                  {getBackupTypeLabel(job.backup_type)}
                                </Badge>
                                <span className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                                  {job.status.toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                <p>Criado em: {new Date(job.created_at).toLocaleString('pt-BR')}</p>
                                {job.start_time && (
                                  <p>Iniciado em: {new Date(job.start_time).toLocaleString('pt-BR')}</p>
                                )}
                                {job.end_time && (
                                  <p>Finalizado em: {new Date(job.end_time).toLocaleString('pt-BR')}</p>
                                )}
                              </div>

                              {job.status === 'completed' && (
                                <div className="text-sm">
                                  <p>Tabelas processadas: {job.processed_tables}/{job.total_tables}</p>
                                  <p>Total de registros: {job.total_records.toLocaleString('pt-BR')}</p>
                                  {job.backup_size_bytes > 0 && (
                                    <p>Tamanho: {formatFileSize(job.backup_size_bytes)}</p>
                                  )}
                                </div>
                              )}

                              {job.notes && (
                                <div className="mt-2 p-2 bg-muted rounded text-sm">
                                  <strong>Notas:</strong> {job.notes}
                                </div>
                              )}

                              {job.error_message && (
                                <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded text-sm">
                                  <strong>Erro:</strong> {job.error_message}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {associatedFiles.map((file) => (
                                <Button
                                  key={file.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadBackup(file.file_path, file.file_name)}
                                  disabled={job.status !== 'completed'}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                              ))}
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Excluir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.
                                      Todos os arquivos associados também serão removidos.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteBackup(job.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir Backup
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Agendamentos de Backup
              </CardTitle>
              <CardDescription>
                Configure backups automáticos recorrentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backupSchedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum agendamento configurado</p>
                  <p className="text-sm">Os agendamentos automáticos estarão disponíveis em breve</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {backupSchedules.map((schedule) => (
                    <Card key={schedule.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{schedule.schedule_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Tipo: {getBackupTypeLabel(schedule.backup_type)} • 
                              Expressão: {schedule.cron_expression} • 
                              Retenção: {schedule.retention_days} dias
                            </p>
                            {schedule.last_run && (
                              <p className="text-sm text-muted-foreground">
                                Última execução: {new Date(schedule.last_run).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <Badge variant={schedule.is_active ? "default" : "secondary"}>
                            {schedule.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};