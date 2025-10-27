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
  HardDrive,
  RotateCcw,
  Shield,
  Pause,
  Info
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export const BackupTab: React.FC = () => {
  const {
    loading,
    backupJobs,
    backupFiles,
    backupSchedules,
    restoreLogs,
    executeBackup,
    executeRestore,
    downloadBackup,
    deleteBackup,
    updateBackupSchedule,
    deleteBackupSchedule,
    createBackupSchedule,
    formatFileSize,
    getStatusColor,
    calculateNextRun,
    formatCronExpression
  } = useBackupSystem();

  const [backupType, setBackupType] = useState<'full' | 'incremental' | 'selective' | 'schema_only'>('full');
  const [backupNotes, setBackupNotes] = useState('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  
  // Restore states
  const [selectedBackupId, setSelectedBackupId] = useState<string>("");
  const [restoreTargetTables, setRestoreTargetTables] = useState<string[]>([]);
  const [conflictStrategy, setConflictStrategy] = useState<"replace" | "skip" | "merge">("skip");
  const [createSafetyBackup, setCreateSafetyBackup] = useState(true);
  const [restoreNotes, setRestoreNotes] = useState<string>("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  // Schedule creation states
  const [scheduleName, setScheduleName] = useState<string>("");
  const [scheduleBackupType, setScheduleBackupType] = useState<'full' | 'incremental' | 'selective' | 'schema_only'>('full');
  const [cronExpression, setCronExpression] = useState<string>("");
  const [cronPreset, setCronPreset] = useState<string>("");
  const [scheduleSelectedTables, setScheduleSelectedTables] = useState<string[]>([]);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [scheduleNotes, setScheduleNotes] = useState<string>("");

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

  const handleExecuteRestore = async () => {
    if (!selectedBackupId) return;
    
    setIsRestoring(true);
    try {
      await executeRestore({
        backupJobId: selectedBackupId,
        targetTables: restoreTargetTables.length > 0 ? restoreTargetTables : undefined,
        conflictStrategy,
        createBackupBeforeRestore: createSafetyBackup,
        notes: restoreNotes || undefined
      });
      
      // Reset form
      setSelectedBackupId("");
      setRestoreTargetTables([]);
      setRestoreNotes("");
      setRestoreDialogOpen(false);
      
    } catch (error) {
      console.error('Erro ao executar restore:', error);
    } finally {
      setIsRestoring(false);
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

  const cronPresets = [
    { label: 'Diário (12:00)', value: '0 12 * * *' },
    { label: 'Semanal (Dom 02:00)', value: '0 2 * * 0' },
    { label: 'Mensal (1º dia 03:00)', value: '0 3 1 * *' },
    { label: 'Personalizado', value: 'custom' }
  ];

  const handleCronPresetChange = (preset: string) => {
    setCronPreset(preset);
    if (preset !== 'custom') {
      setCronExpression(preset);
    } else {
      setCronExpression('');
    }
  };

  const handleCreateSchedule = async () => {
    if (!scheduleName || !cronExpression) return;

    try {
      // Calculate next_run before creating the schedule
      const nextRun = calculateNextRun(cronExpression);
      
      await createBackupSchedule({
        schedule_name: scheduleName,
        backup_type: scheduleBackupType,
        cron_expression: cronExpression,
        next_run: nextRun.toISOString(),
        tables_included: scheduleBackupType === 'selective' ? scheduleSelectedTables : undefined,
        retention_days: retentionDays,
        notes: scheduleNotes || undefined,
        is_active: true
      });

      // Reset form
      setScheduleName('');
      setScheduleBackupType('full');
      setCronExpression('');
      setCronPreset('');
      setScheduleSelectedTables([]);
      setRetentionDays(30);
      setScheduleNotes('');
    } catch (error) {
      console.error('Error creating schedule:', error);
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Criar Backup</TabsTrigger>
            <TabsTrigger value="restore">Restaurar</TabsTrigger>
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

        {/* Restore Tab */}
        <TabsContent value="restore" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Restaurar Backup
              </CardTitle>
              <CardDescription>
                Restaure dados de um backup existente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="backup-select">Selecionar Backup</Label>
                  <Select 
                    value={selectedBackupId} 
                    onValueChange={setSelectedBackupId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um backup para restaurar" />
                    </SelectTrigger>
                    <SelectContent>
                      {backupJobs.filter(job => job.status === 'completed').map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {getBackupTypeLabel(job.backup_type)} - {new Date(job.created_at).toLocaleString('pt-BR')}
                          {job.notes && ` (${job.notes.substring(0, 30)}...)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="conflict-strategy">Estratégia de Conflito</Label>
                  <Select 
                    value={conflictStrategy} 
                    onValueChange={(value: "replace" | "skip" | "merge") => setConflictStrategy(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Pular registros existentes</SelectItem>
                      <SelectItem value="replace">Substituir dados existentes</SelectItem>
                      <SelectItem value="merge">Atualizar registros existentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="safety-backup" 
                    checked={createSafetyBackup}
                    onCheckedChange={(checked) => setCreateSafetyBackup(checked as boolean)}
                  />
                  <Label htmlFor="safety-backup" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Criar backup de segurança antes de restaurar
                  </Label>
                </div>

                <div>
                  <Label htmlFor="restore-tables">Tabelas Específicas (opcional)</Label>
                  <Input
                    placeholder="Ex: companies,profiles,users (deixe vazio para todas)"
                    value={restoreTargetTables.join(',')}
                    onChange={(e) => setRestoreTargetTables(
                      e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="restore-notes">Observações</Label>
                  <Textarea
                    id="restore-notes"
                    placeholder="Descrição do motivo da restauração..."
                    value={restoreNotes}
                    onChange={(e) => setRestoreNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => setRestoreDialogOpen(true)}
                  disabled={!selectedBackupId || isRestoring}
                  className="w-full"
                  variant="destructive"
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Restaurando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restaurar Backup
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {restoreLogs && restoreLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Restaurações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {restoreLogs.map((log) => (
                    <Card key={log.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(log.status)}
                              <span className="font-medium">
                                {log.restore_type === 'full' ? 'Restauração Completa' : 'Restauração Seletiva'}
                              </span>
                              <Badge variant="outline" className={getStatusColor(log.status)}>
                                {log.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.start_time && new Date(log.start_time).toLocaleString('pt-BR')}
                              {log.records_restored && ` • ${log.records_restored} registros`}
                              {log.tables_restored && ` • ${log.tables_restored.length} tabelas`}
                            </div>
                            {log.notes && (
                              <div className="text-sm text-muted-foreground">
                                {log.notes}
                              </div>
                            )}
                            {log.error_message && (
                              <div className="text-sm text-destructive">
                                Erro: {log.error_message}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
          {/* Create Schedule Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Criar Agendamento Automático
              </CardTitle>
              <CardDescription>
                Configure backups automáticos recorrentes com rotação automática
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="schedule-name">Nome do Agendamento</Label>
                  <Input
                    id="schedule-name"
                    placeholder="Ex: Backup Diário Completo"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="schedule-backup-type">Tipo de Backup</Label>
                  <Select value={scheduleBackupType} onValueChange={(value: any) => setScheduleBackupType(value)}>
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

                {scheduleBackupType === 'selective' && (
                  <div>
                    <Label>Tabelas para Backup (separadas por vírgula)</Label>
                    <Input
                      placeholder="Ex: companies, profiles, user_roles"
                      value={scheduleSelectedTables.join(', ')}
                      onChange={(e) => setScheduleSelectedTables(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    />
                    <div className="mt-2 text-sm text-muted-foreground">
                      Tabelas disponíveis: {availableTables.join(', ')}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="cron-preset">Frequência</Label>
                  <Select value={cronPreset} onValueChange={handleCronPresetChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      {cronPresets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {cronPreset === 'custom' && (
                  <div>
                    <Label htmlFor="cron-expression">Expressão Cron Personalizada</Label>
                    <Input
                      id="cron-expression"
                      placeholder="Ex: 0 2 * * * (todo dia às 2:00)"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                    />
                    <div className="mt-2 text-sm text-muted-foreground">
                      Formato: minuto hora dia mês dia-da-semana
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="retention-days">Retenção (dias)</Label>
                  <Input
                    id="retention-days"
                    type="number"
                    min="7"
                    max="365"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(Number(e.target.value))}
                  />
                  <div className="mt-2 text-sm text-muted-foreground">
                    Sistema mantém máximo de 5 backups por agendamento
                  </div>
                </div>

                <div>
                  <Label htmlFor="schedule-notes">Notas (opcional)</Label>
                  <Textarea
                    id="schedule-notes"
                    placeholder="Descrição ou observações sobre este agendamento..."
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleCreateSchedule} 
                  disabled={!scheduleName || !cronExpression || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando Agendamento...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Criar Agendamento
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Existing Schedules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Agendamentos Existentes
              </CardTitle>
              <CardDescription>
                Gerencie seus agendamentos de backup automático
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backupSchedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum agendamento configurado</p>
                  <p className="text-sm">Use o formulário acima para criar seu primeiro agendamento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {backupSchedules.map((schedule) => {
                    const nextRun = schedule.next_run ? new Date(schedule.next_run) : calculateNextRun(schedule.cron_expression, schedule.last_run);
                    const isOverdue = nextRun < new Date();
                    
                    return (
                      <Card key={schedule.id} className={`${schedule.is_active ? 'border-primary/20' : 'border-muted'}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{schedule.schedule_name}</h4>
                                <Badge variant={schedule.is_active ? "default" : "secondary"}>
                                  {schedule.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                                {schedule.is_active && isOverdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    Atrasado
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                <div>
                                  <p><strong>Tipo:</strong> {getBackupTypeLabel(schedule.backup_type)}</p>
                                  <p><strong>Frequência:</strong> {formatCronExpression(schedule.cron_expression)}</p>
                                  <p><strong>Retenção:</strong> {schedule.retention_days} dias (máx. 5 backups)</p>
                                </div>
                                
                                <div>
                                  {schedule.last_run ? (
                                    <p><strong>Última execução:</strong> {new Date(schedule.last_run).toLocaleString('pt-BR')}</p>
                                  ) : (
                                    <p><strong>Última execução:</strong> Nunca executado</p>
                                  )}
                                  
                                  {schedule.is_active && (
                                    <p className={isOverdue ? 'text-destructive font-medium' : 'text-primary'}>
                                      <strong>Próxima execução:</strong> {nextRun.toLocaleString('pt-BR')}
                                    </p>
                                  )}
                                  
                                  {schedule.tables_included && schedule.tables_included.length > 0 && (
                                    <p><strong>Tabelas:</strong> {schedule.tables_included.length} selecionadas</p>
                                  )}
                                </div>
                              </div>
                              
                              {schedule.notes && (
                                <p className="text-sm text-muted-foreground mt-2 italic">
                                  {schedule.notes}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateBackupSchedule(schedule.id, { is_active: !schedule.is_active })}
                              >
                                {schedule.is_active ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-1" />
                                    Pausar
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-1" />
                                    Ativar
                                  </>
                                )}
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Excluir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o agendamento "{schedule.schedule_name}"? 
                                      Esta ação não pode ser desfeita e os backups automáticos serão interrompidos.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteBackupSchedule(schedule.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir Agendamento
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
                  
                  <div className="bg-muted/30 rounded-lg p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground mb-1">Sistema de Rotação Automática</p>
                        <p className="text-muted-foreground">
                          O sistema mantém automaticamente apenas os 5 backups mais recentes de cada agendamento. 
                          Backups mais antigos são removidos automaticamente para economizar espaço de armazenamento.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar Restauração
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá restaurar dados do backup selecionado. 
              {conflictStrategy === 'replace' && (
                <span className="text-destructive font-medium">
                  {" "}ATENÇÃO: Dados existentes serão substituídos permanentemente.
                </span>
              )}
              {createSafetyBackup && (
                <span className="text-primary">
                  {" "}Um backup de segurança será criado automaticamente antes da restauração.
                </span>
              )}
              <br /><br />
              Tem certeza de que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExecuteRestore}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Restauração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};