import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface StrategicPlan {
  id: string;
  name: string;
  status: string;
  period_start: string;
  period_end: string;
  vision?: string;
  mission?: string;
}

interface DeletePlanModalProps {
  plan: StrategicPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (planId: string) => Promise<void>;
  objectivesCount: number;
}

export const DeletePlanModal: React.FC<DeletePlanModalProps> = ({
  plan,
  isOpen,
  onClose,
  onDelete,
  objectivesCount
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!plan) return;

    setIsDeleting(true);
    try {
      await onDelete(plan.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!plan) return null;

  const canDelete = objectivesCount === 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            {canDelete ? (
              <>
                Tem certeza que deseja excluir o plano estratégico <strong>"{plan.name}"</strong>?
                <br /><br />
                Esta ação não pode ser desfeita.
              </>
            ) : (
              <>
                Não é possível excluir o plano estratégico <strong>"{plan.name}"</strong> porque ele possui <strong>{objectivesCount} objetivo{objectivesCount !== 1 ? 's' : ''}</strong> vinculado{objectivesCount !== 1 ? 's' : ''}.
                <br /><br />
                Remova todos os objetivos vinculados antes de excluir o plano.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {canDelete && (
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir Plano'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};