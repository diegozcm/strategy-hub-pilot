import { useState, useMemo } from "react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { useAllUsers, useUsersStats, useCompaniesForSelect, UserWithDetails } from "@/hooks/admin/useUsersStats";
import { useQueryClient } from "@tanstack/react-query";
import { StatCard } from "../../components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserCheck, MoreHorizontal, Shield, Eye, Edit, Key, Mail, UserX, ShieldCheck, ShieldOff } from "lucide-react";
import {
  UserDetailsModal,
  EditUserModal,
  UserStatusModal,
  ResetPasswordModal,
  ResendCredentialsModal,
  AdminPrivilegeModal
} from "./modals";

type ModalType = 'details' | 'edit' | 'status' | 'password' | 'credentials' | 'admin' | null;

export default function ActiveUsersPage() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useUsersStats();
  const { data: companies } = useCompaniesForSelect();
  const { data: users, isLoading } = useAllUsers({ status: 'active' });

  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [statusAction, setStatusAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [adminAction, setAdminAction] = useState<'promote' | 'demote'>('promote');

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCompany = companyFilter === "all" || user.company_ids.includes(companyFilter);
      return matchesSearch && matchesCompany;
    });
  }, [users, searchQuery, companyFilter]);

  const openModal = (type: ModalType, user: UserWithDetails) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const openStatusModal = (action: 'deactivate' | 'reactivate', user: UserWithDetails) => {
    setSelectedUser(user);
    setStatusAction(action);
    setModalType('status');
  };

  const openAdminModal = (action: 'promote' | 'demote', user: UserWithDetails) => {
    setSelectedUser(user);
    setAdminAction(action);
    setModalType('admin');
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['all-users'] });
    queryClient.invalidateQueries({ queryKey: ['users-stats'] });
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '??';
  };

  return (
    <AdminPageContainer title="Usuários Ativos" description="Usuários com acesso ativo ao sistema">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total de Usuários Ativos" value={statsLoading ? '-' : stats?.activeUsers || 0} icon={UserCheck} variant="success" isLoading={statsLoading} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Lista de Usuários Ativos</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar usuário..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" />
              </div>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Empresa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies?.map(company => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum usuário ativo encontrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} />
                          <AvatarFallback className="text-xs">{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.first_name} {user.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{user.company_name || <span className="text-muted-foreground">Sem empresa</span>}</TableCell>
                    <TableCell>
                      {user.is_system_admin ? (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
                      ) : (
                        <Badge variant="outline">Usuário</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openModal('details', user)}>
                            <Eye className="h-4 w-4 mr-2" />Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openModal('edit', user)}>
                            <Edit className="h-4 w-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openModal('password', user)}>
                            <Key className="h-4 w-4 mr-2" />Gerar Nova Senha
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openModal('credentials', user)}>
                            <Mail className="h-4 w-4 mr-2" />Reenviar Credenciais
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.is_system_admin ? (
                            <DropdownMenuItem onClick={() => openAdminModal('demote', user)} className="text-amber-600">
                              <ShieldOff className="h-4 w-4 mr-2" />Remover Privilégio Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => openAdminModal('promote', user)}>
                              <ShieldCheck className="h-4 w-4 mr-2" />Promover a Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openStatusModal('deactivate', user)} className="text-destructive">
                            <UserX className="h-4 w-4 mr-2" />Desativar Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <UserDetailsModal
        open={modalType === 'details'}
        onOpenChange={(open) => !open && setModalType(null)}
        user={selectedUser}
      />
      <EditUserModal
        open={modalType === 'edit'}
        onOpenChange={(open) => !open && setModalType(null)}
        user={selectedUser}
        onSuccess={handleSuccess}
      />
      <UserStatusModal
        open={modalType === 'status'}
        onOpenChange={(open) => !open && setModalType(null)}
        user={selectedUser}
        action={statusAction}
        onSuccess={handleSuccess}
      />
      <ResetPasswordModal
        open={modalType === 'password'}
        onOpenChange={(open) => !open && setModalType(null)}
        user={selectedUser}
        onSuccess={handleSuccess}
      />
      <ResendCredentialsModal
        open={modalType === 'credentials'}
        onOpenChange={(open) => !open && setModalType(null)}
        user={selectedUser}
        onSuccess={handleSuccess}
      />
      <AdminPrivilegeModal
        open={modalType === 'admin'}
        onOpenChange={(open) => !open && setModalType(null)}
        user={selectedUser}
        action={adminAction}
        onSuccess={handleSuccess}
      />
    </AdminPageContainer>
  );
}