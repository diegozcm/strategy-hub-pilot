import { useNavigate } from "react-router-dom";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, CheckCircle, XCircle, Users } from "lucide-react";
import { useModulesStats } from "@/hooks/admin/useModulesStats";
import { StatCard } from "../../components/StatCard";

const permissions = [
  { text: "Visualizar objetivos, KRs e indicadores", allowed: true },
  { text: "Registrar check-ins nos KRs atribuídos", allowed: true },
  { text: "Ver relatórios básicos", allowed: true },
  { text: "Visualizar dashboard", allowed: true },
  { text: "Criar objetivos ou KRs", allowed: false },
  { text: "Editar indicadores", allowed: false },
  { text: "Acessar configurações", allowed: false },
  { text: "Exportar dados", allowed: false },
  { text: "Gerenciar outros usuários", allowed: false },
];

export default function MemberRolePage() {
  const navigate = useNavigate();
  const { data, isLoading } = useModulesStats();

  return (
    <AdminPageContainer
      title="Role: Membro"
      description="Nível básico com foco em visualização e check-ins"
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
              <div className="h-14 w-14 rounded-lg bg-green-500 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle>Membro</CardTitle>
                <CardDescription className="mt-1">
                  Nível básico para colaboradores
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
              O <strong>Membro</strong> tem acesso de leitura aos dados do módulo e pode registrar 
              check-ins nos indicadores que lhe foram atribuídos. Este papel é ideal para 
              colaboradores individuais que precisam acompanhar e atualizar seu progresso.
            </p>
            <p className="text-muted-foreground mt-4">
              Membros não podem criar, editar ou excluir objetivos e indicadores, mantendo a 
              integridade dos dados estratégicos definidos pela liderança.
            </p>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permissões do Membro</CardTitle>
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
                value={data?.roleStats.member || 0}
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
