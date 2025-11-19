import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface ClearInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  companyName: string;
  insightsCount: number;
  loading: boolean;
}

export const ClearInsightsModal: React.FC<ClearInsightsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  companyName,
  insightsCount,
  loading,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmValid = confirmText === 'LIMPAR';

  const handleConfirm = async () => {
    if (!isConfirmValid) return;
    await onConfirm();
    setConfirmText('');
  };

  const handleClose = () => {
    if (loading) return;
    setConfirmText('');
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Atenção: Exclusão Permanente
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p className="text-foreground">
              Esta ação irá excluir permanentemente <strong>TODOS</strong> os insights (ativos e histórico) e recomendações da empresa <strong>{companyName}</strong>.
            </p>
            <p className="text-muted-foreground">
              Esta ação não pode ser desfeita.
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm">
              <p className="text-foreground font-medium">
                Você está prestes a deletar <strong>{insightsCount} insights</strong> e todas suas recomendações.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-text" className="text-foreground">
                Digite <span className="font-mono font-bold bg-muted px-1">LIMPAR</span> para confirmar:
              </Label>
              <Input
                id="confirm-text"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite LIMPAR"
                disabled={loading}
                className="font-mono"
                autoComplete="off"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmValid || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
