import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { OKRObjective } from '@/types/okr';
import { useOKRPermissions } from '@/hooks/useOKRPermissions';
import { useOKRKeyResults } from '@/hooks/useOKRKeyResults';
import { useOKRObjectives } from '@/hooks/useOKRObjectives';
import { OKRObjectiveForm } from './OKRObjectiveForm';
import { OKRKeyResultItem } from './OKRKeyResultItem';
import { OKRKeyResultForm } from './OKRKeyResultForm';

interface OKRObjectiveModalProps {
  objective: OKRObjective | null;
  open: boolean;
  onClose: () => void;
}

export const OKRObjectiveModal: React.FC<OKRObjectiveModalProps> = ({
  objective,
  open,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showKRForm, setShowKRForm] = useState(false);
  const { canEditObjective, canDeleteObjective, canCreateKR } = useOKRPermissions();
  const { updateObjective, deleteObjective } = useOKRObjectives(objective?.okr_quarter_id || null);
  const { keyResults, createKeyResult, loading: krLoading } = useOKRKeyResults(objective?.id || null);

  if (!objective) return null;

  const canEdit = canEditObjective(objective.owner_id);
  const canDelete = canDeleteObjective(objective.owner_id);

  const handleUpdateObjective = async (data: any) => {
    await updateObjective(objective.id, data);
    setIsEditing(false);
  };

  const handleDeleteObjective = async () => {
    await deleteObjective(objective.id);
    setShowDeleteDialog(false);
    onClose();
  };

  const handleCreateKR = async (data: any) => {
    await createKeyResult({
      ...data,
      okr_objective_id: objective.id,
      current_value: data.initial_value,
      progress_percentage: 0,
    });
    setShowKRForm(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">
                  {objective.title}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {objective.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {objective.priority}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && !isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {isEditing ? (
              <OKRObjectiveForm
                objective={objective}
                quarterId={objective.okr_quarter_id}
                onSubmit={handleUpdateObjective}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                {objective.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-muted-foreground">{objective.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Progresso</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Progresso geral
                      </span>
                      <span className="font-semibold">
                        {Math.round(objective.progress_percentage)}%
                      </span>
                    </div>
                    <Progress value={objective.progress_percentage} className="h-2" />
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">
                      Key Results ({keyResults.length})
                    </h3>
                    {canCreateKR && !showKRForm && (
                      <Button
                        size="sm"
                        onClick={() => setShowKRForm(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar KR
                      </Button>
                    )}
                  </div>

                  {showKRForm && (
                    <div className="mb-4 p-4 border rounded-lg">
                      <OKRKeyResultForm
                        objectiveId={objective.id}
                        onSubmit={handleCreateKR}
                        onCancel={() => setShowKRForm(false)}
                        loading={krLoading}
                      />
                    </div>
                  )}

                  {keyResults.length === 0 && !showKRForm ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum Key Result criado ainda</p>
                      {canCreateKR && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => setShowKRForm(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeiro KR
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {keyResults.map((kr) => (
                        <OKRKeyResultItem key={kr.id} keyResult={kr} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este objetivo? Esta ação não pode ser desfeita
              e todos os Key Results associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteObjective}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
