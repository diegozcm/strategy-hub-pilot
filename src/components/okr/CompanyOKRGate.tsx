import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CompanyOKRGateProps {
  children: ReactNode;
}

/**
 * ETAPA 3: Componente que valida se OKR está habilitado para a empresa atual
 * Mostra mensagem informativa caso contrário
 */
export const CompanyOKRGate = ({ children }: CompanyOKRGateProps) => {
  const { company, companies } = useAuth();
  const navigate = useNavigate();

  // Verificar se OKR está habilitado para a empresa atual
  const okrEnabled = company?.okr_enabled === true;

  // Se habilitado, renderizar conteúdo
  if (okrEnabled) {
    return <>{children}</>;
  }

  // Verificar se há outras empresas com OKR habilitado
  const companiesWithOKR = companies?.filter((c) => c.okr_enabled) || [];
  const hasOtherOKRCompanies = companiesWithOKR.length > 0;

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <CardTitle>Módulo OKR Não Habilitado</CardTitle>
              <CardDescription>
                O módulo OKR Execution não está disponível para esta empresa
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              O módulo <strong>OKR Execution</strong> não está habilitado para a empresa{' '}
              <strong>{company?.name}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Entre em contato com o administrador do sistema para habilitar este módulo.
            </p>
          </div>

          {hasOtherOKRCompanies && (
            <>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">
                  Empresas com OKR Habilitado:
                </p>
                <div className="space-y-2">
                  {companiesWithOKR.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{c.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Aqui você pode implementar a lógica de troca de empresa
                          // Por enquanto apenas recarrega a página
                          window.location.reload();
                        }}
                      >
                        Acessar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={() => navigate('/app/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
