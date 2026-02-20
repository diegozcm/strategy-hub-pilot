import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompanyHeader } from "./shared/CompanyHeader";
import { UserPlus, Search, UserMinus, Users, Check, X } from "lucide-react";
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
  avatar_url?: string | null;
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
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (open && company) {
      loadUsers();
      setShowAddPanel(false);
      setAddSearchTerm("");
      setSearchTerm("");
    }
  }, [open, company]);

  const loadUsers = async () => {
    if (!company) return;
    setLoading(true);

    try {
      const { data: users, error: usersError } = await supabase
        .rpc('get_company_users', { _company_id: company.id });

      if (usersError) throw usersError;
      setCompanyUsers(users || []);

      const companyUserIds = (users || []).map((u: any) => u.user_id);
      
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, avatar_url')
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

  const filteredCompanyUsers = useMemo(() => {
    if (!searchTerm) return companyUsers;
    const term = searchTerm.toLowerCase();
    return companyUsers.filter(u =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }, [companyUsers, searchTerm]);

  const filteredAvailableUsers = useMemo(() => {
    if (!addSearchTerm) return availableUsers;
    const term = addSearchTerm.toLowerCase();
    return availableUsers.filter(u => 
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }, [availableUsers, addSearchTerm]);

  const handleAddUser = async (userId: string) => {
    if (!company) return;
    setAdding(userId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('assign_user_to_company_v2', {
        _admin_id: user.id,
        _company_id: company.id,
        _user_id: userId
      });

      if (error) throw error;

      toast({
        title: "Usuário adicionado",
        description: "O usuário foi vinculado à empresa.",
      });

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
      setAdding(null);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!company) return;
    setRemoving(userId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('unassign_user_from_company_v2', {
        _admin_id: user.id,
        _company_id: company.id,
        _user_id: userId
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Usuários
          </DialogTitle>
          <DialogDescription>
            Adicione ou remova usuários de {company.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <CompanyHeader company={company} />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Toggle Add Panel */}
          {!showAddPanel ? (
            <Button
              variant="outline"
              onClick={() => setShowAddPanel(true)}
              className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Usuário à Empresa
            </Button>
          ) : (
            /* Add User Panel */
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Adicionar Usuário
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setShowAddPanel(false); setAddSearchTerm(""); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={addSearchTerm}
                  onChange={(e) => setAddSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="pl-9"
                  autoFocus
                />
              </div>

              <ScrollArea className="max-h-[200px]">
                {filteredAvailableUsers.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    {addSearchTerm ? "Nenhum usuário encontrado" : "Todos os usuários já estão vinculados"}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredAvailableUsers.slice(0, 20).map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between p-2.5 rounded-md hover:bg-background transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(user.first_name, user.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddUser(user.user_id)}
                          disabled={adding === user.user_id}
                          className="shrink-0 h-8 px-3 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          {adding === user.user_id ? (
                            <span className="text-xs">Adicionando...</span>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              <span className="text-xs">Adicionar</span>
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                    {filteredAvailableUsers.length > 20 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Mostrando 20 de {filteredAvailableUsers.length}. Use a busca para filtrar.
                      </p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Current Users */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">
                Usuários da Empresa ({companyUsers.length})
              </h4>
            </div>

            {companyUsers.length > 5 && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar usuários..."
                  className="pl-9 h-9"
                />
              </div>
            )}

            <ScrollArea className="flex-1 max-h-[300px]">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filteredCompanyUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{searchTerm ? "Nenhum resultado" : "Nenhum usuário vinculado"}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCompanyUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.first_name, user.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge 
                          variant={user.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUser(user.user_id)}
                          disabled={removing === user.user_id}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
