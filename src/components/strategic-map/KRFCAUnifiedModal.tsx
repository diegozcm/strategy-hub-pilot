import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

        <Tabs defaultValue="unified" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unified">FCAs e Ações</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="unified" className="space-y-4">
            <FCAActionsTable keyResult={keyResult} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Relatórios</h3>
              <p className="text-muted-foreground">
                Funcionalidade de relatórios em desenvolvimento
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};