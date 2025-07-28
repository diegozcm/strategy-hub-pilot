import React from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/PermissionGate';

interface NoCompanyMessageProps {
  onConfigureCompany?: () => void;
}

export const NoCompanyMessage: React.FC<NoCompanyMessageProps> = ({ onConfigureCompany }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-4">Configure sua Empresa</h1>
        <p className="text-muted-foreground mb-8">
          Para começar a usar o Mapa Estratégico, primeiro configure as informações básicas da sua empresa.
        </p>
        <PermissionGate requiresAdmin fallback={
          <p className="text-sm text-muted-foreground">
            Apenas administradores podem criar empresas. Entre em contato com um administrador do sistema.
          </p>
        }>
          {onConfigureCompany && (
            <Button onClick={onConfigureCompany} size="lg">
              <Building2 className="mr-2 h-5 w-5" />
              Configurar Empresa
            </Button>
          )}
        </PermissionGate>
      </div>
    </div>
  );
};