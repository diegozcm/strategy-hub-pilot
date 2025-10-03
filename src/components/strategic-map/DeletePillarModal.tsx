import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { StrategicPillar } from '@/types/strategic-map';

interface DeletePillarModalProps {
  pillar: StrategicPillar;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
  objectivesCount: number;
}

export const DeletePillarModal = ({ pillar, open, onClose, onConfirm, objectivesCount }: DeletePillarModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const success = await onConfirm(pillar.id);
    setLoading(false);
    
    if (success) {
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja excluir o pilar "{pillar.name}"?
            </p>
            {objectivesCount > 0 ? (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Este pilar possui {objectivesCount} objetivo(s) estratégico(s) vinculado(s).
                </p>
                <p className="text-sm text-destructive mt-1">
                  Não é possível excluir um pilar que possui objetivos vinculados. 
                  Remova ou mova os objetivos primeiro.
                </p>
              </div>
            ) : (
              <p className="text-sm">
                Esta ação não pode ser desfeita.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          {objectivesCount === 0 && (
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? "Excluindo..." : "Excluir Pilar"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};