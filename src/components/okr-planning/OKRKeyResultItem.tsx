import React, { useState } from 'react';
import { Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import { OKRKeyResult } from '@/types/okr';
import { useOKRPermissions } from '@/hooks/useOKRPermissions';
import { useOKRKeyResults } from '@/hooks/useOKRKeyResults';
import { OKRKeyResultForm } from './OKRKeyResultForm';

interface OKRKeyResultItemProps {
  keyResult: OKRKeyResult;
}

export const OKRKeyResultItem: React.FC<OKRKeyResultItemProps> = ({
  keyResult,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { canEditKR, canDeleteKR } = useOKRPermissions();
  const { updateKeyResult, deleteKeyResult } = useOKRKeyResults(keyResult.okr_objective_id);

  const canEdit = canEditKR(keyResult.owner_id);
  const canDelete = canDeleteKR(keyResult.owner_id);

  const handleUpdate = async (data: any) => {
    await updateKeyResult(keyResult.id, data);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteKeyResult(keyResult.id);
    setShowDeleteDialog(false);
  };

  if (isEditing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <OKRKeyResultForm
            keyResult={keyResult}
            objectiveId={keyResult.okr_objective_id}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{keyResult.title}</h4>
                  {keyResult.target_direction === 'maximize' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                {keyResult.description && (
                  <p className="text-sm text-muted-foreground">
                    {keyResult.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {canEdit && (
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

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Inicial:</span>
                <span className="font-semibold">
                  {keyResult.initial_value}{keyResult.unit}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Atual:</span>
                <span className="font-semibold">
                  {keyResult.current_value}{keyResult.unit}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Alvo:</span>
                <span className="font-semibold">
                  {keyResult.target_value}{keyResult.unit}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-semibold">
                  {Math.round(keyResult.progress_percentage)}%
                </span>
              </div>
              <Progress value={keyResult.progress_percentage} className="h-2" />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {keyResult.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este Key Result? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
