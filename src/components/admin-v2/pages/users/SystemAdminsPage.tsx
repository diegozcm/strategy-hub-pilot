import { useState, useMemo } from "react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { useAllUsers, useUsersStats, UserWithDetails } from "@/hooks/admin/useUsersStats";
import { useQueryClient } from "@tanstack/react-query";
import { StatCard } from "../../components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Shield, MoreHorizontal, AlertTriangle, UserPlus, ShieldOff, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  UserDetailsModal,
  AdminPrivilegeModal
} from "./modals";

type ModalType = 'details' | 'admin' | 'add' | null;

export default function SystemAdminsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useUsersStats();
  const { data: users, isLoading } = useAllUsers({ isAdmin: true });

  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);

  // Add admin dialog state
  const [addEmail, setAddEmail] = useState("");
  const [searchedUser, setSearchedUser] = useState<UserWithDetails | null>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user =>
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const openModal = (type: ModalType, user: UserWithDetails) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['all-users'] });
    queryClient.invalidateQueries({ queryKey: ['users-stats'] });
  };

  const handleSearchUser = async () => {
    if (!addEmail.trim()) {
      toast({ title: 'Email necessário', description: 'Digite um email para buscar.', variant: 'destructive' });
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, status, company_id, first_login_at, must_change_password, created_at, avatar_url')
        .eq('email', addEmail.trim())
        .single();

      if (error || !data) {
        toast({ title: 'Usuário não encontrado', description: 'Nenhum usuário encontrado com este email.', variant: 'destructive' });
        setSearchedUser(null);
        return;
      }

      // Check if already admin
      const isAlreadyAdmin = users?.some(u => u.user_id === data.user_id);
      if (isAlreadyAdmin) {
        toast({ title: 'Usuário já é Admin', description: 'Este usuário já é um administrador do sistema.', variant: 'destructive' });
        setSearchedUser(null);
        return;
      }

      setSearchedUser({
        ...data,
        company_name: null,
        is_system_admin: false,
        company_ids: []
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      toast({ title: 'Erro', description: 'Erro ao buscar usuário.', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!searchedUser) return;

    setAdding(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: searchedUser.user_id, role: 'admin' });

      if (error) throw error;

      toast({ title: 'Sucesso', description: `${searchedUser.email} foi adicionado como administrador.` });
      setModalType(null);
      setAddEmail('');
      setSearchedUser(null);
      handleSuccess();
    } catch (error: any) {
      console.error('Erro ao adicionar admin:', error);
      toast({ title: 'Erro', description: error.message || 'Erro ao adicionar administrador.', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '??';
  };

  return (
    <AdminPageContainer title="Administradores do Sistema" description="Usuários com privilégios administrativos completos">
      <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Atenção</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          Administradores do sistema têm acesso completo a todas as funcionalidades, incluindo gerenciamento de empresas, usuários e configurações críticas. Gerencie esses privilégios com cautela.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total de Administradores" value={statsLoading ? '-' : stats?.systemAdmins || 0} icon={Shield} variant="info" isLoading={statsLoading} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Lista de Administradores</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar administrador..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" />
              </div>
              <Button onClick={() => setModalType('add')}>
                <UserPlus className="h-4 w-4 mr-2" />Adicionar Admin
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum administrador encontrado</p>
              <p className="text-sm">Adicione administradores para gerenciar o sistema.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Administrador</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 ring-2 ring-amber-200">
                          <AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} />
                          <AvatarFallback className="text-xs bg-amber-100 text-amber-700">{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{user.first_name} {user.last_name}</span>
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <Shield className="h-3 w-3" />
                            <span>Administrador</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{user.company_name || <span className="text-muted-foreground">Sem empresa</span>}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openModal('details', user)}>
                            <Eye className="h-4 w-4 mr-2" />Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openModal('admin', user)} 
                            className="text-destructive"
                            disabled={filteredUsers.length <= 1}
                          >
                            <ShieldOff className="h-4 w-4 mr-2" />Remover Privilégio Admin
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
      <AdminPrivilegeModal
        open={modalType === 'admin'}
        onOpenChange={(open) => !open && setModalType(null)}
        user={selectedUser}
        action="demote"
        onSuccess={handleSuccess}
      />

      {/* Add Admin Dialog */}
      <Dialog open={modalType === 'add'} onOpenChange={(open) => {
        if (!open) {
          setModalType(null);
          setAddEmail('');
          setSearchedUser(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Administrador</DialogTitle>
            <DialogDescription>
              Busque um usuário por email para torná-lo administrador do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email do Usuário</Label>
              <div className="flex gap-2">
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                />
                <Button onClick={handleSearchUser} disabled={searching} variant="outline">
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {searchedUser && (
              <Card className="border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={searchedUser.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(searchedUser.first_name, searchedUser.last_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{searchedUser.first_name} {searchedUser.last_name}</p>
                      <p className="text-sm text-muted-foreground">{searchedUser.email}</p>
                    </div>
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalType(null); setAddEmail(''); setSearchedUser(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleAddAdmin} disabled={!searchedUser || adding} className="bg-amber-600 hover:bg-amber-700">
              {adding ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adicionando...</>
              ) : (
                <><Shield className="h-4 w-4 mr-2" />Adicionar como Admin</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageContainer>
  );
}