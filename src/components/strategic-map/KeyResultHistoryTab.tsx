import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KeyResult } from '@/types/strategic-map';
import { useKeyResultHistory } from '@/hooks/useKeyResultHistory';
import { Clock, User, TrendingUp, TrendingDown } from 'lucide-react';

interface KeyResultHistoryTabProps {
  keyResult: KeyResult;
}

export const KeyResultHistoryTab = ({ keyResult }: KeyResultHistoryTabProps) => {
  const { history, loading, loadHistory } = useKeyResultHistory();

  useEffect(() => {
    loadHistory(keyResult.id);
  }, [keyResult.id, loadHistory]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_started': return 'Não Iniciado';
      case 'in_progress': return 'Em Progresso';
      case 'completed': return 'Completo';
      case 'suspended': return 'Suspenso';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'default';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhuma alteração registrada ainda. As próximas modificações serão exibidas aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {history.map((entry, index) => (
          <Card key={entry.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Alteração #{history.length - index}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(entry.changed_at).toLocaleString('pt-BR')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <User className="w-3 h-3 mr-1" />
                    {entry.changed_by}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Status Change */}
              {entry.previous_status && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Status:</span>
                  <div className="text-xs text-muted-foreground">
                    Progresso: {entry.change_reason || 'Atualização de valores'}
                  </div>
                </div>
              )}

              {/* Value Changes */}
              {entry.previous_current_value !== undefined && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Valor Atual:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {entry.previous_current_value?.toLocaleString('pt-BR')} {keyResult.unit}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-sm font-medium">
                      {keyResult.current_value?.toLocaleString('pt-BR')} {keyResult.unit}
                    </span>
                    {keyResult.current_value > (entry.previous_current_value || 0) ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              )}

              {/* Target Value Changes */}
              {entry.previous_target_value !== undefined && entry.previous_target_value !== keyResult.target_value && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Meta:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {entry.previous_target_value?.toLocaleString('pt-BR')} {keyResult.unit}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-sm font-medium">
                      {keyResult.target_value?.toLocaleString('pt-BR')} {keyResult.unit}
                    </span>
                  </div>
                </div>
              )}

              {/* Title Changes */}
              {entry.previous_title && entry.previous_title !== keyResult.title && (
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium block mb-1">Título alterado:</span>
                  <div className="text-sm">
                    <span className="line-through text-muted-foreground">{entry.previous_title}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{keyResult.title}</span>
                  </div>
                </div>
              )}

              {/* Description Changes */}
              {entry.previous_description && entry.previous_description !== keyResult.description && (
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium block mb-1">Descrição alterada:</span>
                  <div className="text-sm">
                    <p className="line-through text-muted-foreground mb-1">{entry.previous_description}</p>
                    <p className="font-medium">{keyResult.description}</p>
                  </div>
                </div>
              )}

              {/* Monthly Values Changes */}
              {entry.previous_monthly_actual && JSON.stringify(entry.previous_monthly_actual) !== JSON.stringify(keyResult.monthly_actual) && (
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium block mb-2">Valores mensais atualizados</span>
                  <div className="text-xs text-muted-foreground">
                    Novos valores realizados foram registrados para acompanhamento mensal.
                  </div>
                </div>
              )}

              {entry.change_reason && (
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <span className="text-sm font-medium block mb-1">Motivo da alteração:</span>
                  <p className="text-sm text-blue-700">{entry.change_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};