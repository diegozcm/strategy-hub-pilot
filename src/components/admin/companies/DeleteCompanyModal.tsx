import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { Company } from '@/types/admin';

interface DeleteCompanyModalProps {
  company: Company | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (companyId: string) => void;
}

export const DeleteCompanyModal: React.FC<DeleteCompanyModalProps> = ({
  company,
  open,
  onClose,
  onConfirm
}) => {
  if (!company) return null;

  const handleConfirm = () => {
    onConfirm(company.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Excluir Empresa</DialogTitle>
              <DialogDescription className="mt-1">
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Tem certeza que deseja excluir a empresa <strong>{company.name}</strong>?
          </p>
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive">
              <strong>Atenção:</strong> Todos os dados relacionados à empresa serão permanentemente removidos, 
              incluindo planos estratégicos, pilares, objetivos e projetos.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Excluir Empresa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};