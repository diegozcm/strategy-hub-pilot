import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { KeyResult } from '@/types/strategic-map';
import { useState } from 'react';
import { Plus, Calendar, FileText, AlertCircle, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

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
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

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
          {/* New Report Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Relatórios Apontados</h3>
              <p className="text-sm text-muted-foreground">
                Documente o progresso e mantenha um histórico detalhado
              </p>
            </div>
            {!showNewReportForm && (
              <Button onClick={() => setShowNewReportForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {editingReport ? 'Cancelar Edição' : 'Novo Relatório'}
              </Button>
            )}
          </div>

          {/* New Report Form (Collapsible) */}
          {showNewReportForm && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {editingReport ? 'Editar Relatório' : 'Novo Relatório de Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Documente o status atual do resultado-chave. Seja específico sobre conquistas, desafios e próximos passos.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status-summary">Resumo da Situação Atual *</Label>
                    <Textarea
                      id="status-summary"
                      placeholder="Descreva o status geral do resultado-chave..."
                      value={statusSummary}
                      onChange={(e) => setStatusSummary(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="achievements">Conquistas e Progressos</Label>
                    <Textarea
                      id="achievements"
                      placeholder="Liste as principais conquistas e marcos alcançados..."
                      value={achievements}
                      onChange={(e) => setAchievements(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="challenges">Desafios e Obstáculos</Label>
                    <Textarea
                      id="challenges"
                      placeholder="Descreva os principais desafios enfrentados..."
                      value={challenges}
                      onChange={(e) => setChallenges(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="next-steps">Próximos Passos</Label>
                    <Textarea
                      id="next-steps"
                      placeholder="Defina as próximas ações e prioridades..."
                      value={nextSteps}
                      onChange={(e) => setNextSteps(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={handleCancelNewReport}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveReport}
                      disabled={!statusSummary.trim() || loading}
                    >
                      {loading ? 'Salvando...' : editingReport ? 'Atualizar Relatório' : 'Salvar Relatório'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reports History */}
          <Collapsible open={isHistoryExpanded} onOpenChange={setIsHistoryExpanded}>
            <div className="flex justify-between items-center">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto font-semibold text-base">
                  {isHistoryExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Histórico de Relatórios
                </Button>
              </CollapsibleTrigger>
              <div className="text-sm text-muted-foreground">
                {reports.length} relatórios encontrados
              </div>
            </div>

            <CollapsibleContent className="space-y-4 mt-4">
              {reports.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum relatório encontrado. Crie o primeiro relatório usando o botão "Novo Relatório" acima.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Relatório de {formatDate(report.report_date)}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                              {formatDate(report.created_at)}
                              {report.updated_at !== report.created_at && ' (editado)'}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditReport(report)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingReportId(report.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-1">Situação Atual</h4>
                          <p className="text-sm text-muted-foreground">{report.status_summary}</p>
                        </div>
                        {report.achievements && (
                          <div>
                            <h4 className="font-medium text-sm mb-1">Conquistas</h4>
                            <p className="text-sm text-muted-foreground">{report.achievements}</p>
                          </div>
                        )}
                        {report.challenges && (
                          <div>
                            <h4 className="font-medium text-sm mb-1">Desafios</h4>
                            <p className="text-sm text-muted-foreground">{report.challenges}</p>
                          </div>
                        )}
                        {report.next_steps && (
                          <div>
                            <h4 className="font-medium text-sm mb-1">Próximos Passos</h4>
                            <p className="text-sm text-muted-foreground">{report.next_steps}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
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