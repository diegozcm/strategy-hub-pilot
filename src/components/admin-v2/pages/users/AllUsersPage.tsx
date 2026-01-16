import React, { useState, useMemo } from 'react';
import { AdminPageContainer } from '../../components/AdminPageContainer';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAllUsers, useUsersStats, useCompaniesForSelect } from '@/hooks/admin/useUsersStats';
import { Users, UserCheck, UserX, Shield, Search, Plus, MoreHorizontal, Eye, Edit, Key, UserCog, Power, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AllUsersPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useUsersStats();
  const { data: companies } = useCompaniesForSelect();
  const { data: users, isLoading } = useAllUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const matchesSearch = !searchQuery || user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) || user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) || user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || user.status === statusFilter;
      const matchesCompany = !companyFilter || user.company_id === companyFilter;
      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [users, searchQuery, statusFilter, companyFilter]);

  const handleNotImplemented = (action: string) => { toast({ title: "Funcionalidade em Desenvolvimento", description: `A ação "${action}" será implementada em breve.` }); };
  const getInitials = (firstName?: string | null, lastName?: string | null) => `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';

  return (
    <AdminPageContainer title="Todos os Usuários" description="Gerencie todos os usuários do sistema">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total de Usuários" value={statsLoading ? '-' : stats?.totalUsers || 0} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Usuários Ativos" value={statsLoading ? '-' : stats?.activeUsers || 0} icon={<UserCheck className="h-5 w-5" />} trend="success" />
        <StatCard title="Usuários Inativos" value={statsLoading ? '-' : stats?.inactiveUsers || 0} icon={<UserX className="h-5 w-5" />} />
        <StatCard title="Administradores" value={statsLoading ? '-' : stats?.systemAdmins || 0} icon={<Shield className="h-5 w-5" />} />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Lista de Usuários</CardTitle>
            <Button onClick={() => navigate('/app/admin-v2/users/create')}><Plus className="h-4 w-4 mr-2" />Criar Usuário</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por nome ou email..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Todas as Empresas" /></SelectTrigger><SelectContent><SelectItem value="">Todas as Empresas</SelectItem>{companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="">Todos</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="inactive">Inativos</SelectItem></SelectContent></Select>
          </div>
          {isLoading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : filteredUsers.length === 0 ? <div className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Email</TableHead><TableHead>Empresa</TableHead><TableHead>Status</TableHead><TableHead>Perfil</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(user.first_name, user.last_name)}</AvatarFallback></Avatar><span className="font-medium">{user.first_name} {user.last_name}</span></div></TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{user.company_name || <span className="text-muted-foreground">Sem empresa</span>}</TableCell>
                    <TableCell><StatusBadge status={user.status === 'active' ? 'success' : 'inactive'}>{user.status === 'active' ? 'Ativo' : 'Inativo'}</StatusBadge></TableCell>
                    <TableCell>{user.is_system_admin ? <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Shield className="h-3 w-3 mr-1" />Admin</Badge> : <Badge variant="outline">Usuário</Badge>}</TableCell>
                    <TableCell>
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleNotImplemented('Ver Detalhes')}><Eye className="h-4 w-4 mr-2" />Ver Detalhes</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleNotImplemented('Editar')}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleNotImplemented('Gerenciar Módulos')}><UserCog className="h-4 w-4 mr-2" />Gerenciar Módulos</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleNotImplemented('Redefinir Senha')}><Key className="h-4 w-4 mr-2" />Redefinir Senha</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleNotImplemented(user.status === 'active' ? 'Desativar' : 'Ativar')}><Power className="h-4 w-4 mr-2" />{user.status === 'active' ? 'Desativar' : 'Ativar'}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleNotImplemented('Excluir')} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
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
    </AdminPageContainer>
  );
}
