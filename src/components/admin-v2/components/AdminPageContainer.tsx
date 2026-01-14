import { ReactNode } from "react";
import { ShieldX, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useIsSystemAdmin } from "@/hooks/useIsSystemAdmin";

interface AdminPageContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AdminPageContainer({ title, description, children }: AdminPageContainerProps) {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading } = useIsSystemAdmin();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldX className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Acesso Restrito</h2>
                <p className="text-sm text-muted-foreground">
                  Você não tem permissão para acessar esta área. 
                  Entre em contato com um administrador do sistema se acredita que isso é um erro.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate("/app")}
                className="mt-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o App
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
}
