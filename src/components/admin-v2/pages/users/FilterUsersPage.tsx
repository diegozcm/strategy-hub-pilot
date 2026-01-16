import { useState, useMemo } from "react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { useAllUsers, useCompaniesForSelect } from "@/hooks/admin/useUsersStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "../../components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, MoreHorizontal, Shield, X, RefreshCw } from "lucide-react";

export default function FilterUsersPage() {
  const { toast } = useToast();
  const { data: companies } = useCompaniesForSelect();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [neverLoggedIn, setNeverLoggedIn] = useState(false);
  const [pendingPassword, setPendingPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);

  const filters = useMemo(() => {
    if (!filtersApplied) return undefined;
    return {
      status: statusFilter !== "all" ? statusFilter : undefined,
      companyId: companyFilter !== "all" ? companyFilter : undefined,
      neverLoggedIn: neverLoggedIn || undefined,
      pendingPassword: pendingPassword || undefined,
      isAdmin: isAdmin || undefined,
    };
  }, [filtersApplied, statusFilter, companyFilter, neverLoggedIn, pendingPassword, isAdmin]);

  const { data: users, isLoading } = useAllUsers(filters);

  const filteredUsers = useMemo(() => {
    if (!users || !filtersApplied) return [];
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user =>
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery, filtersApplied]);

  const handleApplyFilters = () => setFiltersApplied(true);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCompanyFilter("all");
    setNeverLoggedIn(false);
    setPendingPassword(false);
    setIsAdmin(false);
    setFiltersApplied(false);
  };

  const handleNotImplemented = (action: string) => {
    toast({ title: "Funcionalidade em Desenvolvimento", description: `A ação "${action}" será implementada em breve.` });
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '??';
  };

  return (
    <AdminPageContainer title="Filtrar Usuários" description="Busca avançada com múltiplos critérios">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buscar por nome ou email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Digite para buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger><SelectValue placeholder="Todas as empresas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies?.map(company => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Todos os status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Checkbox id="neverLoggedIn" checked={neverLoggedIn} onCheckedChange={(c) => setNeverLoggedIn(!!c)} />
              <Label htmlFor="neverLoggedIn" className="cursor-pointer">Nunca fez login</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="pendingPassword" checked={pendingPassword} onCheckedChange={(c) => setPendingPassword(!!c)} />
              <Label htmlFor="pendingPassword" className="cursor-pointer">Aguardando troca de senha</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="isAdmin" checked={isAdmin} onCheckedChange={(c) => setIsAdmin(!!c)} />
              <Label htmlFor="isAdmin" className="cursor-pointer">Administradores do sistema</Label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleApplyFilters}><Filter className="h-4 w-4 mr-2" />Aplicar Filtros</Button>
            <Button variant="outline" onClick={handleClearFilters}><X className="h-4 w-4 mr-2" />Limpar Filtros</Button>
          </div>
        </CardContent>
      </Card>

      {filtersApplied && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Resultados ({filteredUsers.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleApplyFilters}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado com os filtros aplicados.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.user_id}>
                      <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} /><AvatarFallback className="text-xs">{getInitials(user.first_name, user.last_name)}</AvatarFallback></Avatar><span className="font-medium">{user.first_name} {user.last_name}</span></div></TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{user.company_name || <span className="text-muted-foreground">Sem empresa</span>}</TableCell>
                      <TableCell><StatusBadge status={user.status === 'active' ? 'active' : 'inactive'} label={user.status === 'active' ? 'Ativo' : 'Inativo'} /></TableCell>
                      <TableCell>{user.is_system_admin ? <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Shield className="h-3 w-3 mr-1" />Admin</Badge> : <Badge variant="outline">Usuário</Badge>}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleNotImplemented("Ver Detalhes")}>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNotImplemented("Editar")}>Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleNotImplemented("Excluir")} className="text-destructive">Excluir</DropdownMenuItem>
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
      )}

      {!filtersApplied && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Configure os filtros acima</p>
            <p className="text-sm">Selecione os critérios de busca e clique em "Aplicar Filtros" para ver os resultados.</p>
          </CardContent>
        </Card>
      )}
    </AdminPageContainer>
  );
}
