import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KeyResult } from '@/types/strategic-map';
import { FCAActionsTable } from './FCAActionsTable';

interface KRFCAUnifiedModalProps {
  keyResult: KeyResult | null;
  open: boolean;
  onClose: () => void;
}

export const KRFCAUnifiedModal = ({ keyResult, open, onClose }: KRFCAUnifiedModalProps) => {
  if (!keyResult) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">FCA & Ações - {keyResult.title}</DialogTitle>
          <DialogDescription>
            Gerencie Fatos, Causas, Ações e acompanhe o progresso dos planos de ação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FCAActionsTable keyResult={keyResult} />
        </div>
      </DialogContent>
    </Dialog>
  );
};