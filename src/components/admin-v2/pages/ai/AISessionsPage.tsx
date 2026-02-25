import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAIChatSessions, useCompaniesMap } from "@/hooks/admin/useAIUsageStats";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AISessionsPage = () => {
  const { data: sessions = [], isLoading } = useAIChatSessions();
  const { data: companiesMap = {} } = useCompaniesMap();

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-accent" />
        Histórico de Sessões
      </h1>
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Mensagens</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Última atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.session_title || "Sem título"}</TableCell>
                  <TableCell>{companiesMap[s.company_id] || "—"}</TableCell>
                  <TableCell className="text-right">{s.ai_chat_messages?.length || 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(s.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.updated_at ? format(new Date(s.updated_at), "dd/MM/yy HH:mm", { locale: ptBR }) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {sessions.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma sessão encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISessionsPage;
