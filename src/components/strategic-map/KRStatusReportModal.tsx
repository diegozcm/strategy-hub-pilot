import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyResult } from '@/types/strategic-map';
import { useState } from 'react';
import { Plus, Calendar, FileText, AlertCircle } from 'lucide-react';

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

  if (!keyResult) return null;

  const handleSaveReport = async () => {
    if (!statusSummary.trim()) return;

    setLoading(true);
    try {
      // TODO: Implementar salvamento no banco via hook
      const newReport: StatusReport = {
        id: Date.now().toString(), // Temporário
        key_result_id: keyResult.id,
        report_date: new Date().toISOString().split('T')[0],
        status_summary: statusSummary,
        challenges: challenges,
        achievements: achievements,
        next_steps: nextSteps,
        created_by: 'user-id', // TODO: Pegar do contexto de auth
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setReports(prev => [newReport, ...prev]);
      
      // Limpar formulário
      setStatusSummary('');
      setChallenges('');
      setAchievements('');
      setNextSteps('');
      
      console.log('Report saved:', newReport);
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setLoading(false);
    }
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
          <DialogTitle className="text-2xl">Status Report - {keyResult.title}</DialogTitle>
          <DialogDescription>
            Documente o progresso atual e mantenha um histórico detalhado da evolução do resultado-chave
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="new-report" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new-report">Novo Relatório</TabsTrigger>
            <TabsTrigger value="history">Histórico ({reports.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="new-report" className="space-y-6">
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
                <Label htmlFor="achievements">Conquistas e Avanços</Label>
                <Textarea
                  id="achievements"
                  placeholder="Descreva as principais conquistas e avanços obtidos..."
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
                  placeholder="Descreva as ações planejadas para o próximo período..."
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveReport}
                  disabled={!statusSummary.trim() || loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Relatório'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Histórico de Relatórios</h3>
              <div className="text-sm text-muted-foreground">
                {reports.length} relatórios encontrados
              </div>
            </div>

            {reports.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum relatório encontrado. Crie o primeiro relatório na aba "Novo Relatório".
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
                        <div className="text-sm text-muted-foreground">
                          {formatDate(report.created_at)}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};