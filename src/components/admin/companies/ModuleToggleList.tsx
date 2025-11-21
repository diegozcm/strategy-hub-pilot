import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSystemModules, SystemModule, ModuleDataCount } from '@/hooks/useSystemModules';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Info } from 'lucide-react';

interface ModuleToggleListProps {
  companyId: string;
  enabledModules: { [key: string]: boolean };
  onModuleToggle: (moduleSlug: string, enabled: boolean) => void;
  disabled?: boolean;
}

export const ModuleToggleList: React.FC<ModuleToggleListProps> = ({
  companyId,
  enabledModules,
  onModuleToggle,
  disabled = false
}) => {
  const { modules, loading: modulesLoading, getModuleDataCount } = useSystemModules();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    module: SystemModule | null;
    dataCount: ModuleDataCount | null;
    willEnable: boolean;
  }>({
    open: false,
    module: null,
    dataCount: null,
    willEnable: false
  });
  const [checkingData, setCheckingData] = useState(false);

  const getModuleFieldName = (moduleSlug: string): string => {
    // Mapear slug do módulo para o campo no banco de dados
    if (moduleSlug === 'ai') return 'ai_enabled';
    if (moduleSlug === 'okr-execution') return 'okr_enabled';
    return `${moduleSlug.replace(/-/g, '_')}_enabled`;
  };

  const handleToggleAttempt = async (module: SystemModule, currentEnabled: boolean) => {
    const willEnable = !currentEnabled;

    // Se estiver desabilitando, verificar se há dados
    if (!willEnable) {
      setCheckingData(true);
      const dataCount = await getModuleDataCount(companyId, module.slug);
      setCheckingData(false);

      if (dataCount.hasData) {
        // Mostrar warning se houver dados
        setConfirmDialog({
          open: true,
          module,
          dataCount,
          willEnable
        });
        return;
      }
    }

    // Se estiver habilitando ou não houver dados, aplicar mudança diretamente
    onModuleToggle(getModuleFieldName(module.slug), willEnable);
  };

  const handleConfirmToggle = () => {
    if (confirmDialog.module) {
      onModuleToggle(
        getModuleFieldName(confirmDialog.module.slug),
        confirmDialog.willEnable
      );
    }
    setConfirmDialog({ open: false, module: null, dataCount: null, willEnable: false });
  };

  if (modulesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando módulos...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {modules.map((module) => {
          const fieldName = getModuleFieldName(module.slug);
          const isEnabled = enabledModules[fieldName] || false;

          return (
            <div key={module.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`module-${module.slug}`} className="cursor-pointer">
                    {module.name}
                  </Label>
                  {isEnabled && (
                    <Badge variant="outline" className="text-xs">
                      Ativo
                    </Badge>
                  )}
                </div>
                <Switch
                  id={`module-${module.slug}`}
                  checked={isEnabled}
                  onCheckedChange={() => handleToggleAttempt(module, isEnabled)}
                  disabled={disabled || checkingData}
                />
              </div>
              {module.description && (
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {module.description}
                </p>
              )}
            </div>
          );
        })}

        {modules.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum módulo disponível no momento.
          </p>
        )}
      </div>

      {/* Dialog de confirmação para desabilitar módulo com dados */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, module: null, dataCount: null, willEnable: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desabilitar módulo com dados?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Esta empresa possui dados cadastrados no módulo <strong>{confirmDialog.module?.name}</strong>:
              </p>
              {confirmDialog.dataCount && (
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 space-y-1">
                  {Object.entries(confirmDialog.dataCount.counts).map(([key, value]) => (
                    value > 0 && (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-foreground">{key}:</span>
                        <strong className="text-orange-600 dark:text-orange-400">{value}</strong>
                      </div>
                    )
                  ))}
                </div>
              )}
              <p className="text-sm">
                Desabilitar o módulo irá <strong>ocultar</strong> esses dados do sistema, mas <strong>NÃO os deletará</strong>. 
                Ao reabilitar o módulo, todos os dados voltarão a aparecer normalmente.
              </p>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Tem certeza que deseja continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmToggle}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Sim, Desabilitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
