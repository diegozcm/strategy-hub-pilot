import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <AdminPageContainer title="Aguardando Aprovação" description="Usuários que solicitaram acesso ao sistema">
      <Card>
        <CardContent className="py-16 text-center">
          <Clock className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">Nenhum usuário aguardando aprovação</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Quando novos usuários se cadastrarem por conta própria no sistema, eles aparecerão aqui para aprovação manual antes de terem acesso.
          </p>
        </CardContent>
      </Card>
    </AdminPageContainer>
  );
}
