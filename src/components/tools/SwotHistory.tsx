import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSwotAnalysis } from '@/hooks/useSwotAnalysis';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';

interface SwotHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SwotHistory: React.FC<SwotHistoryProps> = ({
  open,
  onOpenChange,
}) => {
  const { loading, history, loadHistory } = useSwotAnalysis();

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, loadHistory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Histórico de Alterações - Análise SWOT</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma alteração registrada ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry: any) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Alteração em {formatDate(entry.changed_at)}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Por: {entry.profiles?.first_name} {entry.profiles?.last_name} 
                      ({entry.profiles?.email})
                    </div>
                    {entry.change_reason && (
                      <div className="text-sm">
                        <strong>Motivo:</strong> {entry.change_reason}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {entry.previous_strengths && (
                        <div className="border border-green-200 rounded-lg p-3 bg-green-50 dark:bg-green-950/20">
                          <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                            Forças (anterior)
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">
                            {entry.previous_strengths}
                          </p>
                        </div>
                      )}

                      {entry.previous_weaknesses && (
                        <div className="border border-red-200 rounded-lg p-3 bg-red-50 dark:bg-red-950/20">
                          <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                            Fraquezas (anterior)
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">
                            {entry.previous_weaknesses}
                          </p>
                        </div>
                      )}

                      {entry.previous_opportunities && (
                        <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 dark:bg-blue-950/20">
                          <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                            Oportunidades (anterior)
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">
                            {entry.previous_opportunities}
                          </p>
                        </div>
                      )}

                      {entry.previous_threats && (
                        <div className="border border-orange-200 rounded-lg p-3 bg-orange-50 dark:bg-orange-950/20">
                          <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-2">
                            Ameaças (anterior)
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">
                            {entry.previous_threats}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};