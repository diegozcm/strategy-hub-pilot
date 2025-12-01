import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const RecalculateKRMetricsButton: React.FC = () => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      
      const { data, error } = await supabase.functions.invoke('recalculate-kr-metrics', {
        body: { recalculate_all: true }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${data.successCount} KRs recalculados com sucesso. ${data.errorCount} erros.`,
      });
    } catch (error) {
      console.error('Error recalculating KR metrics:', error);
      toast({
        title: "Erro",
        description: "Erro ao recalcular métricas dos KRs.",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Button 
      onClick={handleRecalculate}
      disabled={isRecalculating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isRecalculating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Recalculando...
        </>
      ) : (
        <>
          <Activity className="w-4 h-4" />
          Recalcular Métricas KRs
        </>
      )}
    </Button>
  );
};
