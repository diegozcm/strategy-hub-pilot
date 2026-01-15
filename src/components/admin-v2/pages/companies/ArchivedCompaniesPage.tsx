import { Archive, Building2, RotateCcw } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ArchivedCompaniesPage() {
  const { toast } = useToast();

  const handleNotImplemented = (action: string) => {
    toast({
      title: "Funcionalidade em Desenvolvimento",
      description: `A ação "${action}" será implementada em breve.`,
    });
  };

  return (
    <AdminPageContainer 
      title="Empresas Arquivadas" 
      description="Empresas removidas do sistema ativo"
    >
      <Card>
        <CardContent className="py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Archive className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Nenhuma empresa arquivada</h2>
            <p className="text-muted-foreground mb-6">
              Empresas arquivadas aparecerão aqui. O arquivamento permite manter o histórico 
              da empresa sem que ela apareça nas listagens ativas do sistema.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => handleNotImplemented("Arquivar Empresa")}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Arquivar uma Empresa
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleNotImplemented("Restaurar Backup")}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar de Backup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminPageContainer>
  );
}
