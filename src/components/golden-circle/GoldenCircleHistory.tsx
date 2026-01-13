import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGoldenCircle } from '@/hooks/useGoldenCircle';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDateTimeBrazil } from '@/lib/dateUtils';

interface GoldenCircleHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GoldenCircleHistory: React.FC<GoldenCircleHistoryProps> = ({
  open,
  onOpenChange,
}) => {
  const { history, loadHistory, loading } = useGoldenCircle();

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, loadHistory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Histórico de Alterações</DialogTitle>
          <DialogDescription>
            Veja todas as mudanças feitas no Golden Circle da empresa
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum histórico encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Alteração realizada
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {formatDateTimeBrazil(entry.changed_at)}
                        </Badge>
                        <Badge variant="outline">
                          {entry.profiles?.first_name && entry.profiles?.last_name 
                            ? `${entry.profiles.first_name} ${entry.profiles.last_name}`
                            : 'Usuário desconhecido'
                          }
                        </Badge>
                      </div>
                    </div>
                    {entry.change_reason && (
                      <CardDescription>
                        <strong>Motivo:</strong> {entry.change_reason}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {entry.previous_why && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Por quê? (anterior)</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                            {entry.previous_why}
                          </p>
                        </div>
                      )}
                      
                      {entry.previous_how && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Como? (anterior)</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                            {entry.previous_how}
                          </p>
                        </div>
                      )}
                      
                      {entry.previous_what && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">O quê? (anterior)</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                            {entry.previous_what}
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