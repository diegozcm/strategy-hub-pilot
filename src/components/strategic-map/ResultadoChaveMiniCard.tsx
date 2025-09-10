import { useState } from 'react';
import { Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { KeyResult } from '@/types/strategic-map';
import { format } from 'date-fns';
import { EditKeyResultModal } from './EditKeyResultModal';
import { supabase } from '@/integrations/supabase/client';

interface ResultadoChaveMiniCardProps {
  resultadoChave: KeyResult;
  onUpdate?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return 'Concluído';
    case 'suspended': return 'Suspenso';
    case 'in_progress': return 'Em andamento';
    default: return 'Não iniciado';
  }
};

export const ResultadoChaveMiniCard = ({ resultadoChave, onUpdate }: ResultadoChaveMiniCardProps) => {
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Calcular progresso usando yearly_actual se disponível, senão current_value
  const currentValue = resultadoChave.yearly_actual || resultadoChave.current_value || 0;
  const targetValue = resultadoChave.yearly_target || resultadoChave.target_value;
  
  const progress = targetValue > 0 
    ? Math.min((currentValue / targetValue) * 100, 100)
    : 0;

  const handleUpdateKeyResult = async (keyResultData: Partial<KeyResult>) => {
    try {
      const { error } = await supabase
        .from('key_results')
        .update(keyResultData)
        .eq('id', resultadoChave.id);

      if (error) throw error;

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating key result:', error);
      throw error;
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 p-2 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm truncate flex-1">{resultadoChave.title}</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 ml-2"
            onClick={() => setEditModalOpen(true)}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1 text-xs">
            <div className="text-muted-foreground">
              <span className="font-medium">Indicador atual:</span> {currentValue.toFixed(1)} {resultadoChave.unit}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium">Meta:</span> {targetValue} {resultadoChave.unit}
            </div>
            {resultadoChave.due_date && (
              <div className="text-muted-foreground">até {format(new Date(resultadoChave.due_date), 'dd/MM/yyyy')}</div>
            )}
          </div>
          <div className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-nowrap">
            {progress.toFixed(1)}%
          </div>
        </div>
      </div>

      <EditKeyResultModal
        keyResult={resultadoChave}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdateKeyResult}
      />
    </>
  );
};