import { useNavigate } from "react-router-dom";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Rocket, Brain, Package, Users, Building2, Plus, ArrowRight } from "lucide-react";
import { useModulesStats } from "@/hooks/admin/useModulesStats";
import { StatCard } from "../../components/StatCard";

const moduleIcons: Record<string, React.ElementType> = {
  "strategic-planning": Target,
  "startup-hub": Rocket,
  "ai": Brain,
};

const moduleColors: Record<string, string> = {
  "strategic-planning": "bg-cofound-blue-light",
  "startup-hub": "bg-cofound-green",
  "ai": "bg-cofound-blue-dark",
};

export default function AvailableModulesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useModulesStats();

  const getModuleHref = (slug: string) => {
    const slugMap: Record<string, string> = {
      "strategic-planning": "/app/admin/modules/strategic-planning",
      "startup-hub": "/app/admin/modules/startup-hub",
      "ai": "/app/admin/modules/ai-copilot",
    };
    return slugMap[slug] || "/app/admin/modules";
  };

  return (
    <AdminPageContainer
      title="Módulos do Sistema"
      description="Gerencie os módulos disponíveis na plataforma"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : (
            <>
              <StatCard
                title="Módulos Ativos"
                value={data?.activeModules || 0}
                icon={Package}
                description={`${data?.totalModules || 0} módulos totais`}
              />
              <StatCard
                title="Usuários com Acesso"
                value={data?.totalUsers || 0}
                icon={Users}
                description="Em todos os módulos"
              />
              <StatCard
                title="Empresas Utilizando"
                value={data?.totalCompanies || 0}
                icon={Building2}
                description="Com módulos ativos"
              />
            </>
          )}
        </div>

        {/* Modules Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Módulos Disponíveis</h2>
            <Button variant="outline" size="sm" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Novo Módulo
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.modules.map(module => {
                const Icon = moduleIcons[module.slug] || Package;
                const colorClass = moduleColors[module.slug] || "bg-gray-500";
                const userCount = data.usersByModule[module.id] || 0;
                const companyCount = data.companiesByModule[module.id] || 0;

                return (
                  <Card key={module.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`h-12 w-12 rounded-lg ${colorClass} flex items-center justify-center`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge variant={module.active ? "default" : "secondary"}>
                          {module.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-3">{module.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {module.description || "Sem descrição disponível"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>{companyCount} empresas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{userCount} usuários</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(getModuleHref(module.slug))}
                      >
                        Ver Detalhes
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminPageContainer>
  );
}
