import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVisionAlignment } from '@/hooks/useVisionAlignment';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import { Target, Handshake, FolderOpen, AlertTriangle } from 'lucide-react';

interface VisionAlignmentHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VisionAlignmentHistory: React.FC<VisionAlignmentHistoryProps> = ({
  open,
  onOpenChange,
}) => {
  const { loading, history, loadHistory } = useVisionAlignment();

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, loadHistory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico do Alinhamento de Visão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum histórico de alterações encontrado.
              </p>
            </div>
          ) : (
            history.map((entry) => (
              <Card key={entry.id} className="border border-muted">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>
                      Alteração por{' '}
                      {entry.profiles
                        ? `${entry.profiles.first_name} ${entry.profiles.last_name}`
                        : 'Usuário desconhecido'}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {formatDate(entry.changed_at)}
                    </span>
                  </CardTitle>
                  {entry.change_reason && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Motivo:</strong> {entry.change_reason}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Objetivos Conjuntos */}
                    {entry.previous_shared_objectives !== null && (
                      <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex items-center mb-2">
                          <Target className="w-4 h-4 mr-2 text-blue-600" />
                          <h4 className="font-semibold text-blue-700 dark:text-blue-400">
                            Objetivos Conjuntos (Anterior)
                          </h4>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {entry.previous_shared_objectives || 'Não definido'}
                        </p>
                      </div>
                    )}

                    {/* Comprometimentos Conjuntos */}
                    {entry.previous_shared_commitments !== null && (
                      <div className="border border-yellow-200 rounded-lg p-3 bg-yellow-50 dark:bg-yellow-950/20">
                        <div className="flex items-center mb-2">
                          <Handshake className="w-4 h-4 mr-2 text-yellow-600" />
                          <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">
                            Comprometimentos Conjuntos (Anterior)
                          </h4>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {entry.previous_shared_commitments || 'Não definido'}
                        </p>
                      </div>
                    )}

                    {/* Recursos Conjuntos */}
                    {entry.previous_shared_resources !== null && (
                      <div className="border border-orange-200 rounded-lg p-3 bg-orange-50 dark:bg-orange-950/20">
                        <div className="flex items-center mb-2">
                          <FolderOpen className="w-4 h-4 mr-2 text-orange-600" />
                          <h4 className="font-semibold text-orange-700 dark:text-orange-400">
                            Recursos Conjuntos (Anterior)
                          </h4>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {entry.previous_shared_resources || 'Não definido'}
                        </p>
                      </div>
                    )}

                    {/* Riscos Conjuntos */}
                    {entry.previous_shared_risks !== null && (
                      <div className="border border-pink-200 rounded-lg p-3 bg-pink-50 dark:bg-pink-950/20">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="w-4 h-4 mr-2 text-pink-600" />
                          <h4 className="font-semibold text-pink-700 dark:text-pink-400">
                            Riscos Conjuntos (Anterior)
                          </h4>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {entry.previous_shared_risks || 'Não definido'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};