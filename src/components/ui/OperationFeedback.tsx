import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface Operation {
  id: string;
  loading: boolean;
  error: string | null;
  startTime: number;
  retryCount: number;
}

interface OperationFeedbackProps {
  operations: Operation[];
  onRetry?: (operationId: string) => void;
  className?: string;
}

export const OperationFeedback: React.FC<OperationFeedbackProps> = ({ 
  operations, 
  onRetry, 
  className 
}) => {
  if (operations.length === 0) return null;

  const activeOperations = operations.filter(op => op.loading);
  const failedOperations = operations.filter(op => op.error && !op.loading);
  const hasOperations = activeOperations.length > 0 || failedOperations.length > 0;

  if (!hasOperations) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {activeOperations.length > 0 && (
            <>
              <LoadingSpinner size="sm" />
              Operações em Andamento
            </>
          )}
          {activeOperations.length === 0 && failedOperations.length > 0 && (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              Operações com Erro
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active Operations */}
        {activeOperations.map((operation) => {
          const elapsed = Date.now() - operation.startTime;
          const minutes = Math.floor(elapsed / 60000);
          const seconds = Math.floor((elapsed % 60000) / 1000);
          
          return (
            <div key={operation.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{operation.id}</span>
                <Badge variant="outline" className="text-xs">
                  {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
                </Badge>
              </div>
              <Progress value={Math.min((elapsed / 10000) * 100, 95)} className="h-1" />
            </div>
          );
        })}

        {/* Failed Operations */}
        {failedOperations.map((operation) => (
          <div key={operation.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <div>
                <div className="text-sm font-medium">{operation.id}</div>
                <div className="text-xs text-muted-foreground">{operation.error}</div>
              </div>
            </div>
            {onRetry && operation.retryCount < 3 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRetry(operation.id)}
                className="h-6"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Tentar
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};