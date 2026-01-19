import { useNavigate } from "react-router-dom";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Target, Building2, Users, UserCog, User, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatCard } from "../../components/StatCard";

const features = [
  "Mapa Estratégico",
  "Objetivos e KRs",
  "Indicadores",
  "Relatórios",
  "Ferramentas Estratégicas",
  "Dashboard",
];

export default function StrategicPlanningModulePage() {
  const navigate = useNavigate();

  const { data: moduleData, isLoading: moduleLoading } = useQuery({
    queryKey: ["strategic-planning-module"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_modules")
        .select("*")
        .eq("slug", "strategic-planning")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["strategic-planning-stats"],
    queryFn: async () => {
      // Get module ID first
      const { data: module } = await supabase
        .from("system_modules")
        .select("id")
        .eq("slug", "strategic-planning")
        .single();

      if (!module) return { companies: [], totalUsers: 0, managers: 0, members: 0 };

      // Get user roles for this module
      const { data: roles } = await supabase
        .from("user_module_roles")
        .select("user_id, role")
        .eq("module_id", module.id);

      // Get profiles to map users to companies
      const userIds = roles?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, company_id, first_name, last_name")
        .in("user_id", userIds);

      // Get unique company IDs
      const companyIds = [...new Set(profiles?.map(p => p.company_id).filter(Boolean) || [])];
      
      // Get company details
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, status")
        .in("id", companyIds);

      // Calculate stats per company
      const userToCompany: Record<string, string> = {};
      profiles?.forEach(p => {
        if (p.user_id && p.company_id) userToCompany[p.user_id] = p.company_id;
      });

      const companyStats: Record<string, { managers: number; members: number }> = {};
      
      roles?.forEach(r => {
        const companyId = userToCompany[r.user_id];
        if (companyId) {
          if (!companyStats[companyId]) companyStats[companyId] = { managers: 0, members: 0 };
          const role = r.role?.toLowerCase() || "";
          if (role === "admin" || role === "manager" || role === "gestor") {
            companyStats[companyId].managers++;
          } else {
            companyStats[companyId].members++;
          }
        }
      });

      const totalManagers = roles?.filter(r => ["admin", "manager", "gestor"].includes(r.role?.toLowerCase() || "")).length || 0;
      const totalMembers = (roles?.length || 0) - totalManagers;

      return {
        companies: companies?.map(c => ({
          ...c,
          users: (companyStats[c.id]?.managers || 0) + (companyStats[c.id]?.members || 0),
          managers: companyStats[c.id]?.managers || 0,
          members: companyStats[c.id]?.members || 0,
        })) || [],
        totalUsers: roles?.length || 0,
        managers: totalManagers,
        members: totalMembers,
      };
    },
  });

  const isLoading = moduleLoading || statsLoading;

  return (
    <AdminPageContainer
      title="Strategy HUB"
      description="Módulo para gestão de planejamento estratégico"
    >
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/admin-v2/modules")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Módulos
        </Button>

        {/* Module Info + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>Strategy HUB</CardTitle>
                    {isLoading ? (
                      <Skeleton className="h-5 w-16" />
                    ) : (
                      <Badge variant={moduleData?.active ? "default" : "secondary"}>
                        {moduleData?.active ? "Ativo" : "Inativo"}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {moduleData?.description || "Módulo para gestão de planejamento estratégico e OKRs"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">
                    {moduleData?.slug || "strategic-planning"}
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
                  value={statsData?.companies.length || 0}
                  icon={Building2}
                />
                <StatCard
                  title="Usuários"
                  value={statsData?.totalUsers || 0}
                  icon={Users}
                />
              </>
            )}
          </div>
        </div>

        {/* Role Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Gestores"
            value={statsData?.managers || 0}
            icon={UserCog}
            description="Admins e Gerentes"
          />
          <StatCard
            title="Membros"
            value={statsData?.members || 0}
            icon={User}
            description="Acesso básico"
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

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Empresas com este Módulo</CardTitle>
            <CardDescription>
              {statsData?.companies.length || 0} empresas utilizando o Strategy HUB
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : statsData?.companies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma empresa está usando este módulo ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-center">Usuários</TableHead>
                    <TableHead className="text-center">Gestores</TableHead>
                    <TableHead className="text-center">Membros</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData?.companies.map(company => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="text-center">{company.users}</TableCell>
                      <TableCell className="text-center">{company.managers}</TableCell>
                      <TableCell className="text-center">{company.members}</TableCell>
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
