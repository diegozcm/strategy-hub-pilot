import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyHeader } from "./shared/CompanyHeader";
import { UserPlus, Search, UserMinus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CompanyWithDetails {
  id: string;
  name: string;
  logo_url?: string | null;
  status?: string | null;
  company_type?: string | null;
  ai_enabled?: boolean;
}

interface CompanyUser {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url?: string | null;
  status?: string | null;
}

interface AvailableUser {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface ManageCompanyUsersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyWithDetails | null;
  onSuccess: () => void;
}

export function ManageCompanyUsersModal({ 
  open, 
  onOpenChange, 
  company,
  onSuccess 
}: ManageCompanyUsersModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (open && company) {
      loadUsers();
    }
  }, [open, company]);

  const loadUsers = async () => {
    if (!company) return;
    setLoading(true);

    try {
      // Fetch company users via RPC
      const { data: users, error: usersError } = await supabase
        .rpc('get_company_users', { _company_id: company.id });

      if (usersError) throw usersError;
      setCompanyUsers(users || []);

      // Fetch available users (not in this company)
      const companyUserIds = (users || []).map((u: any) => u.user_id);
      
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('status', 'active');

      if (allUsersError) throw allUsersError;

      const available = (allUsers || []).filter(
        u => !companyUserIds.includes(u.user_id)
      );
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailableUsers = useMemo(() => {
    if (!searchTerm) return availableUsers;
    const term = searchTerm.toLowerCase();
    return availableUsers.filter(u => 
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }, [availableUsers, searchTerm]);

  const handleAddUser = async () => {
    if (!company || !selectedUser) return;
    setAdding(true);

    try {
      // Get current admin user id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('assign_user_to_company_v2', {
        _admin_id: user.id,
        _user_id: selectedUser,
        _company_id: company.id
      });

      if (error) throw error;

      toast({
        title: "Usuário adicionado",
        description: "O usuário foi vinculado à empresa.",
      });

      setSelectedUser("");
      loadUsers();
      onSuccess();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o usuário.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!company) return;
    setRemoving(userId);

    try {
      // Get current admin user id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('unassign_user_from_company_v2', {
        _admin_id: user.id,
        _user_id: userId,
        _company_id: company.id
      });

      if (error) throw error;

      toast({
        title: "Usuário removido",
        description: "O usuário foi desvinculado da empresa.",
      });

      loadUsers();
      onSuccess();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário.",
        variant: "destructive",
      });
    } finally {
      setRemoving(null);
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Usuários
          </DialogTitle>
          <DialogDescription>
            Adicione ou remova usuários desta empresa
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <CompanyHeader company={company} />
        </div>

        {/* Add User Section */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Adicionar Usuário
          </h4>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuário..."
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecionar usuário" />
              </SelectTrigger>
              <SelectContent>
                {filteredAvailableUsers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Nenhum usuário disponível
                  </div>
                ) : (
                  filteredAvailableUsers.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddUser} 
              disabled={!selectedUser || adding}
            >
              {adding ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>

        {/* Current Users */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Usuários da Empresa ({companyUsers.length})
          </h4>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : companyUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum usuário vinculado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.first_name, user.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveUser(user.user_id)}
                        disabled={removing === user.user_id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
