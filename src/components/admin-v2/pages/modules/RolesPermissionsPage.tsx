import { useNavigate } from "react-router-dom";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, UserCog, User, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { useModulesStats } from "@/hooks/admin/useModulesStats";
import { StatCard } from "../../components/StatCard";

const roles = [
  {
    id: "admin",
    name: "Administrador",
    icon: Shield,
    color: "bg-red-500",
    description: "Acesso total ao módulo, incluindo configurações avançadas e gestão de usuários.",
    href: "/app/admin-v2/modules/roles/admin",
  },
  {
    id: "manager",
    name: "Gerente",
    icon: UserCog,
    color: "bg-blue-500",
    description: "Gestão de equipes, criação e edição de objetivos e indicadores.",
    href: "/app/admin-v2/modules/roles/manager",
  },
  {
    id: "member",
    name: "Membro",
    icon: User,
    color: "bg-green-500",
    description: "Visualização de dados e registro de check-ins.",
    href: "/app/admin-v2/modules/roles/member",
  },
];

const permissionsMatrix = [
  { action: "Criar objetivos e KRs", admin: true, manager: true, member: false },
  { action: "Editar indicadores", admin: true, manager: true, member: false },
  { action: "Registrar check-in", admin: true, manager: true, member: true },
  { action: "Configurar períodos", admin: true, manager: false, member: false },
  { action: "Ver relatórios", admin: true, manager: true, member: true },
  { action: "Gerenciar permissões", admin: true, manager: false, member: false },
  { action: "Exportar dados", admin: true, manager: true, member: false },
];

export default function RolesPermissionsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useModulesStats();

  return (
    <AdminPageContainer
      title="Roles e Permissões"
      description="Configure os níveis de acesso disponíveis nos módulos"
    >
      <div className="space-y-6">
        {/* Stats */}
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
                title="Administradores"
                value={data?.roleStats.admin || 0}
                icon={Shield}
                description="Acesso total"
              />
              <StatCard
                title="Gerentes"
                value={data?.roleStats.manager || 0}
                icon={UserCog}
                description="Gestão de equipes"
              />
              <StatCard
                title="Membros"
                value={data?.roleStats.member || 0}
                icon={User}
                description="Acesso básico"
              />
            </>
          )}
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map(role => {
            const Icon = role.icon;
            let count = 0;
            if (data) {
              if (role.id === "admin") count = data.roleStats.admin;
              else if (role.id === "manager") count = data.roleStats.manager;
              else if (role.id === "member") count = data.roleStats.member;
            }

            return (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`h-12 w-12 rounded-lg ${role.color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary">{count} usuários</Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{role.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(role.href)}
                  >
                    Ver Detalhes
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matriz de Permissões</CardTitle>
            <CardDescription>
              Comparativo de permissões entre os diferentes níveis de acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ação</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <UserCog className="h-4 w-4" />
                      Gerente
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <User className="h-4 w-4" />
                      Membro
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionsMatrix.map(row => (
                  <TableRow key={row.action}>
                    <TableCell className="font-medium">{row.action}</TableCell>
                    <TableCell className="text-center">
                      {row.admin ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.manager ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.member ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
