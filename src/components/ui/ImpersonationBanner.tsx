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
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-yellow-800">
              Você está visualizando como:
            </span>
            <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded">
              <User className="h-4 w-4 text-yellow-700" />
              <span className="text-sm font-semibold text-yellow-900">
                {profile?.first_name} {profile?.last_name} ({profile?.email})
              </span>
            </div>
            <span className="text-sm text-yellow-700">
              | Administrador original: {originalAdmin.first_name} {originalAdmin.last_name}
            </span>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleEndImpersonation}
          className="bg-white border-yellow-300 text-yellow-800 hover:bg-yellow-50"
        >
          <X className="h-4 w-4 mr-2" />
          Voltar ao usuário original
        </Button>
      </div>
    </div>
  );
};