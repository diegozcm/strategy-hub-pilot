import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { StrategicPillar } from '@/types/strategic-map';

interface DeletePillarModalProps {
  pillar: StrategicPillar;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
  objectivesCount: number;
  krsCount?: number;
}

export const DeletePillarModal = ({ pillar, open, onClose, onConfirm, objectivesCount, krsCount = 0 }: DeletePillarModalProps) => {
  const [loading, setLoading] = useState(false);
  const [confirmName, setConfirmName] = useState('');

  const hasChildren = objectivesCount > 0;
  const isNameMatch = confirmName.trim().toLowerCase() === pillar.name.trim().toLowerCase();
  const canDelete = hasChildren ? isNameMatch : true;

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    const success = await onConfirm(pillar.id);
    setLoading(false);
    
    if (success) {
      setConfirmName('');
      onClose();
    }
  };

  const handleClose = () => {
    setConfirmName('');
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Tem certeza que deseja excluir o pilar "<strong>{pillar.name}</strong>"?
              </p>
              {hasChildren ? (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md space-y-2">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Este pilar possui {objectivesCount} objetivo(s){krsCount > 0 ? ` e ${krsCount} resultado(s)-chave` : ''} vinculado(s).
                  </p>
                  <p className="text-sm text-destructive">
                    Todos os objetivos, resultados-chave e dados relacionados serão excluídos permanentemente.
                  </p>
                  <div className="mt-3">
                    <Label htmlFor="confirm-name" className="text-sm font-medium text-foreground">
                      Digite "<strong>{pillar.name}</strong>" para confirmar:
                    </Label>
                    <Input
                      id="confirm-name"
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder={pillar.name}
                      className="mt-1"
                      disabled={loading}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm">
                  Esta ação não pode ser desfeita.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={loading || !canDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? "Excluindo..." : "Excluir Pilar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
