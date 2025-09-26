import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KeyResult } from '@/types/strategic-map';
import { useState } from 'react';
import { Plus, FileText, AlertCircle, Edit, Trash2, Eye, X } from 'lucide-react';

interface KRStatusReportModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
}

interface StatusReport {
  id: string;
  key_result_id: string;
  report_date: string;
  status_summary: string;
  challenges: string;
  achievements: string;
  next_steps: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const KRStatusReportModal = ({ keyResult, open, onClose }: KRStatusReportModalProps) => {
  const [statusSummary, setStatusSummary] = useState('');
  const [challenges, setChallenges] = useState('');
  const [achievements, setAchievements] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<StatusReport[]>([]);
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [editingReport, setEditingReport] = useState<StatusReport | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);

  if (!keyResult) return null;

  const handleSaveReport = async () => {
    if (!statusSummary.trim()) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (editingReport) {
        // Update existing report
        const updatedReport: StatusReport = {
          ...editingReport,
          status_summary: statusSummary,
          challenges,
          achievements,
          next_steps: nextSteps,
          updated_at: new Date().toISOString(),
        };
        
        setReports(prev => prev.map(r => r.id === editingReport.id ? updatedReport : r));
      } else {
        // Create new report
        const newReport: StatusReport = {
          id: Date.now().toString(),
          key_result_id: keyResult.id,
          report_date: new Date().toISOString(),
          status_summary: statusSummary,
          challenges,
          achievements,
          next_steps: nextSteps,
          created_by: 'current-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        setReports(prev => [newReport, ...prev]);
      }
      
      // Reset form and close
      setStatusSummary('');
      setChallenges('');
      setAchievements('');
      setNextSteps('');
      setShowNewReportForm(false);
      setEditingReport(null);
      setLoading(false);
    }, 1000);
  };

  const handleCancelNewReport = () => {
    setStatusSummary('');
    setChallenges('');
    setAchievements('');
    setNextSteps('');
    setShowNewReportForm(false);
    setEditingReport(null);
  };

  const handleEditReport = (report: StatusReport) => {
    setEditingReport(report);
    setStatusSummary(report.status_summary);
    setChallenges(report.challenges);
    setAchievements(report.achievements);
    setNextSteps(report.next_steps);
    setShowNewReportForm(true);
  };

  const handleDeleteReport = async () => {
    if (!deletingReportId) return;
    
    // Simulate API call
    setTimeout(() => {
      setReports(prev => prev.filter(r => r.id !== deletingReportId));
      setDeletingReportId(null);
    }, 500);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleViewReport = (reportId: string) => {
    setViewingReportId(viewingReportId === reportId ? null : reportId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Relatórios Apontados - {keyResult.title}</DialogTitle>
          <DialogDescription>
            Documente o progresso atual e mantenha um histórico detalhado da evolução do resultado-chave
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">Relatórios de Status</h3>
              <p className="text-sm text-muted-foreground">
                Documente o progresso e mantenha um histórico detalhado
              </p>
            </div>
            <Button onClick={() => setShowNewReportForm(true)} disabled={showNewReportForm || !!editingReport}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Relatório
            </Button>
          </div>

          {/* Inline Report Form */}
          {showNewReportForm && (
            <Card className="border-primary/20 bg-primary/5 animate-in slide-in-from-top-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {editingReport ? 'Editar Relatório' : 'Novo Relatório de Status'}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancelNewReport}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status-summary">Resumo da Situação Atual *</Label>
                    <Textarea
                      id="status-summary"
                      placeholder="Descreva o status geral do resultado-chave..."
                      value={statusSummary}
                      onChange={(e) => setStatusSummary(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="achievements">Conquistas</Label>
                      <Textarea
                        id="achievements"
                        placeholder="Principais conquistas..."
                        value={achievements}
                        onChange={(e) => setAchievements(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="challenges">Desafios</Label>
                      <Textarea
                        id="challenges"
                        placeholder="Obstáculos enfrentados..."
                        value={challenges}
                        onChange={(e) => setChallenges(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="next-steps">Próximos Passos</Label>
                      <Textarea
                        id="next-steps"
                        placeholder="Ações prioritárias..."
                        value={nextSteps}
                        onChange={(e) => setNextSteps(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancelNewReport}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveReport}
                      disabled={!statusSummary.trim() || loading}
                    >
                      {loading ? 'Salvando...' : editingReport ? 'Atualizar' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reports Table */}
          <div className="border rounded-lg">
            {reports.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Nenhum relatório encontrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie o primeiro relatório para começar o acompanhamento do progresso.
                </p>
                {!showNewReportForm && (
                  <Button onClick={() => setShowNewReportForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Relatório
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead>Resumo do Status</TableHead>
                    <TableHead className="w-[140px]">Última Atualização</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <>
                      <TableRow 
                        key={report.id}
                        className={`cursor-pointer transition-colors ${
                          viewingReportId === report.id ? 'bg-muted/50' : 'hover:bg-muted/30'
                        }`}
                        onClick={() => handleViewReport(report.id)}
                      >
                        <TableCell className="font-medium">
                          {formatDate(report.report_date)}
                        </TableCell>
                        <TableCell>
                          <div 
                            className="truncate" 
                            title={report.status_summary}
                          >
                            {truncateText(report.status_summary)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div>
                            {formatDateTime(report.updated_at)}
                            {report.updated_at !== report.created_at && (
                              <div className="text-xs text-primary">(editado)</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewReport(report.id);
                              }}
                              className="h-8 w-8 p-0"
                              title="Visualizar"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditReport(report);
                              }}
                              className="h-8 w-8 p-0"
                              title="Editar"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingReportId(report.id);
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Excluir"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Inline Report View */}
                      {viewingReportId === report.id && (
                        <TableRow className="border-0">
                          <TableCell colSpan={4} className="p-0">
                            <Card className="m-4 border-l-4 border-l-primary bg-primary/5">
                              <CardContent className="p-4">
                                <div className="grid md:grid-cols-3 gap-4">
                                  <div className="md:col-span-3">
                                    <h4 className="font-semibold text-sm mb-2 text-primary">
                                      Situação Atual
                                    </h4>
                                    <p className="text-sm mb-4">{report.status_summary}</p>
                                  </div>
                                  
                                  {report.achievements && (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2">Conquistas</h4>
                                      <p className="text-sm text-muted-foreground">{report.achievements}</p>
                                    </div>
                                  )}
                                  
                                  {report.challenges && (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2">Desafios</h4>
                                      <p className="text-sm text-muted-foreground">{report.challenges}</p>
                                    </div>
                                  )}
                                  
                                  {report.next_steps && (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2">Próximos Passos</h4>
                                      <p className="text-sm text-muted-foreground">{report.next_steps}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex justify-between items-center mt-4 pt-4 border-t text-xs text-muted-foreground">
                                  <div>
                                    Criado em {formatDateTime(report.created_at)}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewingReportId(null)}
                                    className="h-6 text-xs"
                                  >
                                    Fechar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingReportId} onOpenChange={() => setDeletingReportId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteReport} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};