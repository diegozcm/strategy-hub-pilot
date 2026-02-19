import { useNavigate } from "react-router-dom";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, UserCog, CheckCircle, XCircle, Users } from "lucide-react";
import { useModulesStats } from "@/hooks/admin/useModulesStats";
import { StatCard } from "../../components/StatCard";

const permissions = [
  { text: "Criar e editar objetivos e KRs próprios", allowed: true },
  { text: "Visualizar todos os objetivos da empresa", allowed: true },
  { text: "Registrar check-ins e atualizações", allowed: true },
  { text: "Visualizar relatórios e dashboards", allowed: true },
  { text: "Exportar dados", allowed: true },
  { text: "Atribuir responsáveis a KRs", allowed: true },
  { text: "Configurar períodos e ciclos", allowed: false },
  { text: "Gerenciar permissões de outros usuários", allowed: false },
  { text: "Acessar configurações avançadas", allowed: false },
];

export default function ManagerRolePage() {
  const navigate = useNavigate();
  const { data, isLoading } = useModulesStats();

  return (
    <AdminPageContainer
      title="Role: Gerente"
      description="Nível intermediário com foco em gestão de equipe"
    >
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/admin/modules/roles")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Roles
        </Button>

        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-lg bg-blue-500 flex items-center justify-center">
                <UserCog className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle>Gerente</CardTitle>
                <CardDescription className="mt-1">
                  Nível intermediário para gestão operacional
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O <strong>Gerente</strong> pode criar e editar objetivos e indicadores, gerenciar sua 
              equipe e visualizar todos os dados do módulo. Este papel é ideal para líderes de 
              equipe, coordenadores e supervisores que precisam acompanhar o progresso estratégico.
            </p>
            <p className="text-muted-foreground mt-4">
              Gerentes não têm acesso a configurações avançadas do sistema nem podem alterar 
              permissões de outros usuários, mantendo o foco na execução operacional.
            </p>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permissões do Gerente</CardTitle>
            <CardDescription>
              Lista de ações permitidas e restritas para este role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissions.map(permission => (
                <div key={permission.text} className="flex items-center gap-2 text-sm">
                  {permission.allowed ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={!permission.allowed ? "text-muted-foreground" : ""}>
                    {permission.text}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full max-w-xs" />
            ) : (
              <StatCard
                title="Usuários com este Role"
                value={data?.roleStats.manager || 0}
                icon={Users}
                description="Em todos os módulos"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
