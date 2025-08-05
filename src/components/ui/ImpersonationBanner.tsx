import React from 'react';
import { AlertCircle, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/components/ui/use-toast';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, originalAdmin, profile, endImpersonation } = useAuth();
  const { toast } = useToast();

  if (!isImpersonating || !originalAdmin || !endImpersonation) {
    return null;
  }

  const handleEndImpersonation = async () => {
    try {
      const { error } = await endImpersonation();
      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao finalizar impersonation',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Impersonation finalizada',
          description: 'Você voltou ao seu usuário original'
        });
      }
    } catch (error) {
      console.error('Error ending impersonation:', error);
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Você está visualizando como:
            </span>
            <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
              <User className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
              <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                {profile?.first_name} {profile?.last_name} ({profile?.email})
              </span>
            </div>
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              | Administrador original: {originalAdmin.first_name} {originalAdmin.last_name}
            </span>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleEndImpersonation}
          className="bg-card border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
        >
          <X className="h-4 w-4 mr-2" />
          Voltar ao usuário original
        </Button>
      </div>
    </div>
  );
};