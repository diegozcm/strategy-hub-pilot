import { useNavigate } from "react-router-dom";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Brain, Building2, Users, Settings, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatCard } from "../../components/StatCard";
import { toast } from "@/hooks/use-toast";

const features = [
  "Chat com IA",
  "Insights Estratégicos",
  "Recomendações",
  "Análise de Dados",
];

export default function AICopilotModulePage() {
  const navigate = useNavigate();

  const { data: moduleData, isLoading: moduleLoading } = useQuery({
    queryKey: ["ai-copilot-module"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_modules")
        .select("*")
        .eq("slug", "ai")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: aiCompanies, isLoading: companiesLoading } = useQuery({
    queryKey: ["ai-enabled-companies"],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from("companies")
        .select("id, name, status, ai_enabled")
        .eq("ai_enabled", true);
      if (error) throw error;

      // Get user counts per company
      const companyIds = companies?.map(c => c.id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("company_id")
        .in("company_id", companyIds);

      const userCounts: Record<string, number> = {};
      profiles?.forEach(p => {
        if (p.company_id) {
          userCounts[p.company_id] = (userCounts[p.company_id] || 0) + 1;
        }
      });

      return companies?.map(c => ({
        ...c,
        userCount: userCounts[c.id] || 0,
      })) || [];
    },
  });

  const isLoading = moduleLoading || companiesLoading;

  const handleConfigureAI = () => {
    toast({
      title: "Em Desenvolvimento",
      description: "Configurações de IA serão implementadas em breve.",
    });
  };

  return (
    <AdminPageContainer
      title="IA Copilot"
      description="Assistente de IA com chat, insights e recomendações"
    >
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/admin/modules")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Módulos
        </Button>

        {/* Module Info + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-cofound-blue-dark flex items-center justify-center">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>IA Copilot</CardTitle>
                    {isLoading ? (
                      <Skeleton className="h-5 w-16" />
                    ) : (
                      <Badge variant={moduleData?.active ? "cofound-success" : "secondary"}>
                        {moduleData?.active ? "Ativo" : "Inativo"}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {moduleData?.description || "Assistente de IA inteligente para insights estratégicos"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">
                    {moduleData?.slug || "ai"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="ml-2">
                    {moduleData?.created_at
                      ? format(new Date(moduleData.created_at), "dd/MM/yyyy", { locale: ptBR })
                      : "--"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            ) : (
              <>
                <StatCard
                  title="Empresas"
                  value={aiCompanies?.length || 0}
                  icon={Building2}
                  description="Com IA habilitada"
                />
                <StatCard
                  title="Usuários"
                  value={aiCompanies?.reduce((acc, c) => acc + c.userCount, 0) || 0}
                  icon={Users}
                  description="Com acesso à IA"
                />
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funcionalidades Incluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {features.map(feature => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-cofound-green" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration (Visual Only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configurações de IA</CardTitle>
            <CardDescription>
              Configurações globais do modelo de IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Modelo</p>
                <p className="font-medium">GPT-4</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Provider</p>
                <p className="font-medium">OpenAI</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tokens/mês</p>
                <p className="font-medium">100,000</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ações</p>
                  <p className="font-medium">Configurar Modelo</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleConfigureAI}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Empresas com IA Habilitada</CardTitle>
            <CardDescription>
              {aiCompanies?.length || 0} empresas utilizando a IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !aiCompanies || aiCompanies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma empresa está com IA habilitada.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-center">Usuários</TableHead>
                    <TableHead className="text-center">IA Habilitada</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aiCompanies?.map(company => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="text-center">{company.userCount}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="cofound-success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sim
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={company.status === "active" ? "default" : "secondary"}>
                          {company.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
