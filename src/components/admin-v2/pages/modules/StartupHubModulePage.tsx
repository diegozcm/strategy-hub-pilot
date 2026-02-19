import { useNavigate } from "react-router-dom";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Rocket, Building2, Users, UserCog, Link2, Calendar, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatCard } from "../../components/StatCard";
import { useStartupHubStats, useStartupDetails } from "@/hooks/admin/useStartupHubStats";

const features = [
  "Perfil de Startup",
  "Sessões de Mentoria",
  "Avaliação BEEP",
  "Calendário",
  "Gestão de Mentores",
  "Itens de Ação",
];

export default function StartupHubModulePage() {
  const navigate = useNavigate();

  const { data: moduleData, isLoading: moduleLoading } = useQuery({
    queryKey: ["startup-hub-module"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_modules")
        .select("*")
        .eq("slug", "startup-hub")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: hubStats, isLoading: statsLoading } = useStartupHubStats();
  const { data: startups, isLoading: startupsLoading } = useStartupDetails();

  const isLoading = moduleLoading || statsLoading || startupsLoading;

  return (
    <AdminPageContainer
      title="Startup Hub"
      description="Módulo para gestão de startups e processos de aceleração"
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
                <div className="h-14 w-14 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>Startup Hub</CardTitle>
                    {isLoading ? (
                      <Skeleton className="h-5 w-16" />
                    ) : (
                      <Badge variant={moduleData?.active ? "default" : "secondary"}>
                        {moduleData?.active ? "Ativo" : "Inativo"}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {moduleData?.description || "Módulo para gestão de startups e processos de aceleração"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">
                    {moduleData?.slug || "startup-hub"}
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
                  title="Startups"
                  value={hubStats?.totalStartups || 0}
                  icon={Building2}
                  description={`${hubStats?.activeStartups || 0} ativas`}
                />
                <StatCard
                  title="Mentores"
                  value={hubStats?.mentors || 0}
                  icon={UserCog}
                  description={`${hubStats?.activeMentors || 0} ativos`}
                />
              </>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Vínculos Ativos"
            value={hubStats?.mentorLinks || 0}
            icon={Link2}
            description="Mentor-Startup"
          />
          <StatCard
            title="Sessões de Mentoria"
            value={hubStats?.totalSessions || 0}
            icon={Calendar}
            description={`${hubStats?.completedSessions || 0} concluídas`}
          />
          <StatCard
            title="Membros de Startup"
            value={hubStats?.startupMembers || 0}
            icon={Users}
            description="Perfis registrados"
          />
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funcionalidades Incluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {features.map(feature => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Startups Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Startups Cadastradas</CardTitle>
            <CardDescription>
              {startups?.length || 0} startups no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !startups || startups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma startup cadastrada ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Startup</TableHead>
                    <TableHead className="text-center">Membros</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {startups?.map(startup => (
                    <TableRow key={startup.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {startup.logo_url && <AvatarImage src={startup.logo_url} />}
                            <AvatarFallback className="text-xs">
                              {startup.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{startup.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{startup.members}</TableCell>
                      <TableCell>
                        {startup.mentor_name || (
                          <span className="text-muted-foreground text-sm">Sem mentor</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={startup.status === "active" ? "default" : "secondary"}>
                          {startup.status === "active" ? "Ativa" : "Inativa"}
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
