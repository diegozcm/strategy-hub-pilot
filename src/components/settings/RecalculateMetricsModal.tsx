import React, { useState } from 'react';
import { Loader2, CheckCircle, XCircle, Activity, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecalculateMetricsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
}

type Status = 'idle' | 'processing' | 'success' | 'error';

interface Progress {
  totalKRs: number;
  successCount: number;
  errorCount: number;
}

export const RecalculateMetricsModal: React.FC<RecalculateMetricsModalProps> = ({
  open,
  onOpenChange,
  companyId,
  companyName,
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<Progress>({
    totalKRs: 0,
    successCount: 0,
    errorCount: 0,
  });

  const handleRecalculate = async () => {
    try {
      setStatus('processing');
      
      const { data, error } = await supabase.functions.invoke('recalculate-kr-metrics', {
        body: { company_id: companyId }
      });

      if (error) throw error;

      setProgress({
        totalKRs: data.totalKRs || 0,
        successCount: data.successCount || 0,
        errorCount: data.errorCount || 0,
      });

      if (data.errorCount > 0) {
        setStatus('error');
        toast({
          title: "Concluído com erros",
          description: `${data.successCount} KRs recalculados, mas ${data.errorCount} com erro.`,
          variant: "destructive",
        });
      } else {
        setStatus('success');
        toast({
          title: "Sucesso",
          description: `${data.successCount} KRs recalculados com sucesso.`,
        });
      }
    } catch (error) {
      console.error('Error recalculating KR metrics:', error);
      setStatus('error');
      setProgress(prev => ({ ...prev, errorCount: prev.totalKRs }));
      toast({
        title: "Erro",
        description: "Erro ao recalcular métricas dos KRs.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setProgress({ totalKRs: 0, successCount: 0, errorCount: 0 });
    onOpenChange(false);
  };

  const getProgressPercentage = () => {
    if (progress.totalKRs === 0) return 0;
    return Math.round(((progress.successCount + progress.errorCount) / progress.totalKRs) * 100);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return <Activity className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return 'Processando...';
      case 'success':
        return 'Concluído com sucesso!';
      case 'error':
        return 'Concluído com erros';
      default:
        return 'Pronto para iniciar';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Recalcular Métricas dos Resultados-Chave</DialogTitle>
          <DialogDescription>
            Esta operação irá recalcular todas as métricas agregadas (YTD, trimestral, mensal, anual) 
            de todos os KRs da empresa selecionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Company Info */}
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <div className="text-2xl">🏢</div>
            <div>
              <div className="text-sm font-medium">Empresa</div>
              <div className="text-sm text-muted-foreground">{companyName}</div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Esta operação pode levar alguns segundos dependendo da quantidade de KRs.
            </p>
          </div>

          {/* Status Section */}
          {status !== 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <div className="flex-1">
                  <div className="text-sm font-medium">{getStatusText()}</div>
                </div>
              </div>

              {/* Progress Bar */}
              {status === 'processing' && (
                <Progress value={getProgressPercentage()} className="h-2" />
              )}

              {/* Counters */}
              {progress.totalKRs > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-lg font-semibold">{progress.totalKRs}</div>
                  </div>
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded">
                    <div className="text-xs text-muted-foreground">Sucesso</div>
                    <div className="text-lg font-semibold text-green-600">{progress.successCount}</div>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded">
                    <div className="text-xs text-muted-foreground">Erros</div>
                    <div className="text-lg font-semibold text-destructive">{progress.errorCount}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {status === 'idle' ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleRecalculate}>
                Confirmar e Recalcular
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} disabled={status === 'processing'}>
              {status === 'processing' ? 'Processando...' : 'Fechar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
