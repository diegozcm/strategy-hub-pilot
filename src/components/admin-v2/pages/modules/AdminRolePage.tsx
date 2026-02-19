import { useNavigate } from "react-router-dom";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Shield, CheckCircle, Users } from "lucide-react";
import { useModulesStats } from "@/hooks/admin/useModulesStats";
import { StatCard } from "../../components/StatCard";

const permissions = [
  { text: "Criar e editar objetivos, KRs e indicadores", allowed: true },
  { text: "Configurar períodos e ciclos estratégicos", allowed: true },
  { text: "Gerenciar usuários e suas permissões", allowed: true },
  { text: "Visualizar todos os relatórios e dashboards", allowed: true },
  { text: "Exportar dados em diversos formatos", allowed: true },
  { text: "Configurações avançadas do módulo", allowed: true },
  { text: "Deletar objetivos e indicadores", allowed: true },
  { text: "Atribuir responsáveis a KRs", allowed: true },
];

export default function AdminRolePage() {
  const navigate = useNavigate();
  const { data, isLoading } = useModulesStats();

  return (
    <AdminPageContainer
      title="Role: Administrador"
      description="Nível máximo de acesso dentro de um módulo"
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
              <div className="h-14 w-14 rounded-lg bg-red-500 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle>Administrador</CardTitle>
                <CardDescription className="mt-1">
                  O nível máximo de permissão dentro de um módulo
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
              O <strong>Administrador</strong> tem controle total sobre todas as funcionalidades do módulo, 
              incluindo configurações avançadas e gestão de outros usuários. Este papel é ideal para 
              líderes de departamento, gerentes de projeto ou responsáveis pela implementação estratégica 
              da empresa.
            </p>
            <p className="text-muted-foreground mt-4">
              Administradores podem criar, editar e excluir qualquer elemento do sistema, além de 
              gerenciar as permissões de outros usuários dentro do módulo.
            </p>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permissões do Administrador</CardTitle>
            <CardDescription>
              Lista completa de ações permitidas para este role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissions.map(permission => (
                <div key={permission.text} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{permission.text}</span>
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
                value={data?.roleStats.admin || 0}
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
