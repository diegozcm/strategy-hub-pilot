import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, Shield } from 'lucide-react';
import { CleanupCategory, CleanupRequest } from '@/hooks/useDatabaseCleanup';

interface DatabaseCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CleanupCategory;
  filters: Partial<CleanupRequest>;
  recordCount: number;
  onConfirm: (request: CleanupRequest) => Promise<void>;
  loading: boolean;
}

export const DatabaseCleanupModal: React.FC<DatabaseCleanupModalProps> = ({
  isOpen,
  onClose,
  category,
  filters,
  recordCount,
  onConfirm,
  loading
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [step, setStep] = useState<'warning' | 'confirmation'>('warning');

  const requiredConfirmationText = 'CONFIRMAR';

  const handleNext = () => {
    if (step === 'warning') {
      setStep('confirmation');
    }
  };

  const handleConfirm = async () => {
    if (confirmed && confirmationText === requiredConfirmationText) {
      const request: CleanupRequest = {
        category: category.id,
        ...filters
      };
      
      await onConfirm(request);
      handleClose();
    }
  };

  const handleClose = () => {
    setConfirmed(false);
    setConfirmationText('');
    setStep('warning');
    onClose();
  };

  const getFilterDescription = () => {
    const descriptions: string[] = [];
    
    if (filters.companyId) {
      descriptions.push('filtrado por empresa');
    }
    if (filters.userId) {
      descriptions.push('filtrado por usuário');
    }
    if (filters.beforeDate) {
      descriptions.push(`antes de ${new Date(filters.beforeDate).toLocaleDateString('pt-BR')}`);
    }
    
    return descriptions.length > 0 ? ` (${descriptions.join(', ')})` : '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {step === 'warning' ? 'Confirmação de Limpeza' : 'Confirmação Final'}
          </DialogTitle>
          <DialogDescription>
            {step === 'warning' 
              ? 'Esta operação é irreversível. Revise cuidadosamente antes de prosseguir.'
              : 'Digite a confirmação para executar a limpeza dos dados.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'warning' && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">Operação de Alto Risco</h4>
                    <ul className="text-red-700 text-sm space-y-1">
                      <li>• Os dados serão permanentemente removidos</li>
                      <li>• Não há como desfazer esta operação</li>
                      <li>• Faça backup antes de prosseguir</li>
                      <li>• Verifique se todos os filtros estão corretos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Categoria:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={category.dangerous ? "destructive" : "secondary"}>
                      {category.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {category.description}
                  </p>
                </div>

                <div>
                  <Label className="font-semibold">Registros Afetados:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="destructive" className="text-lg px-3 py-1">
                      {recordCount.toLocaleString()} registros
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getFilterDescription()}
                    </span>
                  </div>
                </div>

                {filters.notes && (
                  <div>
                    <Label className="font-semibold">Observações:</Label>
                    <p className="text-sm mt-1 p-2 bg-gray-50 rounded border">
                      {filters.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'confirmation' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-center">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    Você está prestes a remover:
                  </h4>
                  <Badge variant="destructive" className="text-2xl px-4 py-2">
                    {recordCount.toLocaleString()} registros
                  </Badge>
                  <p className="text-yellow-700 text-sm mt-2">
                    de {category.name}{getFilterDescription()}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="confirm-checkbox"
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(checked === true)}
                  />
                  <Label htmlFor="confirm-checkbox" className="text-sm">
                    Entendo que esta operação é irreversível e tenho backup dos dados
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmation-text">
                    Digite "<strong>{requiredConfirmationText}</strong>" para confirmar:
                  </Label>
                  <Input
                    id="confirmation-text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder={requiredConfirmationText}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          
          <div className="flex gap-2">
            {step === 'warning' && (
              <Button 
                variant="destructive" 
                onClick={handleNext}
                disabled={recordCount === 0}
              >
                Prosseguir
              </Button>
            )}
            
            {step === 'confirmation' && (
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={
                  !confirmed || 
                  confirmationText !== requiredConfirmationText || 
                  loading
                }
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {loading ? 'Executando...' : 'Executar Limpeza'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};