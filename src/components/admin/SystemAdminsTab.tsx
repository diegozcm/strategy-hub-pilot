import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, UserPlus, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface SystemAdmin {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface UserSearchResult {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export const SystemAdminsTab: React.FC = () => {
  const [admins, setAdmins] = useState<SystemAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<SystemAdmin | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      // Buscar user_roles com role admin
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, created_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        setAdmins([]);
        return;
      }

      // Buscar profiles dos usuários
      const userIds = userRoles.map(ur => ur.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combinar os dados
      const adminsData = userRoles.map(ur => {
        const profile = profiles?.find(p => p.user_id === ur.user_id);
        return {
          ...ur,
          profiles: profile || {
            email: 'unknown@example.com',
            first_name: null,
            last_name: null,
            avatar_url: null
          }
        };
      });

      setAdmins(adminsData as SystemAdmin[]);
    } catch (error) {
      console.error('Erro ao carregar System Admins:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar lista de administradores',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: 'Email necessário',
        description: 'Digite um email para buscar',
        variant: 'destructive'
      });
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .eq('email', searchEmail.trim())
        .single();

      if (error || !data) {
        toast({
          title: 'Usuário não encontrado',
          description: 'Nenhum usuário encontrado com este email',
          variant: 'destructive'
        });
        setSearchedUser(null);
        return;
      }

      // Verificar se já é admin
      const isAlreadyAdmin = admins.some(admin => admin.user_id === data.user_id);
      if (isAlreadyAdmin) {
        toast({
          title: 'Usuário já é Admin',
          description: 'Este usuário já é um System Admin',
          variant: 'destructive'
        });
        setSearchedUser(null);
        return;
      }

      setSearchedUser(data);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao buscar usuário',
        variant: 'destructive'
      });
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
        .insert({
          user_id: searchedUser.user_id,
          role: 'admin'
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${searchedUser.email} foi adicionado como System Admin`
      });

      setAddDialogOpen(false);
      setSearchEmail('');
      setSearchedUser(null);
      await loadAdmins();
    } catch (error) {
      console.error('Erro ao adicionar admin:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar administrador',
        variant: 'destructive'
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedAdmin) return;

    // Proteção: não permitir remover o último admin
    if (admins.length <= 1) {
      toast({
        title: 'Operação não permitida',
        description: 'Não é possível remover o último System Admin do sistema',
        variant: 'destructive'
      });
      setRemoveDialogOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedAdmin.user_id)
        .eq('role', 'admin');

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${selectedAdmin.profiles.email} foi removido dos System Admins`
      });

      setRemoveDialogOpen(false);
      setSelectedAdmin(null);
      await loadAdmins();
    } catch (error) {
      console.error('Erro ao remover admin:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover administrador',
        variant: 'destructive'
      });
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return email.split('@')[0];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground mt-4">Carregando administradores...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Admins ({admins.length})
              </CardTitle>
              <CardDescription>
                Gerencie os usuários com acesso administrativo ao sistema
              </CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar System Admin</DialogTitle>
                  <DialogDescription>
                    Busque um usuário por email para torná-lo administrador do sistema
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email do Usuário</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@exemplo.com"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSearchUser();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSearchUser}
                        disabled={searching}
                        variant="outline"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {searchedUser && (
                    <Card className="border-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(searchedUser.first_name, searchedUser.last_name, searchedUser.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">
                              {getDisplayName(searchedUser.first_name, searchedUser.last_name, searchedUser.email)}
                            </p>
                            <p className="text-sm text-muted-foreground">{searchedUser.email}</p>
                          </div>
                          <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAddDialogOpen(false);
                      setSearchEmail('');
                      setSearchedUser(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAddAdmin}
                    disabled={!searchedUser || adding}
                  >
                    {adding ? 'Adicionando...' : 'Adicionar como Admin'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum administrador encontrado</p>
              </div>
            ) : (
              admins.map((admin) => (
                <Card key={admin.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={admin.profiles.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(
                            admin.profiles.first_name, 
                            admin.profiles.last_name, 
                            admin.profiles.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {getDisplayName(
                            admin.profiles.first_name, 
                            admin.profiles.last_name, 
                            admin.profiles.email
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {admin.profiles.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Admin desde {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setRemoveDialogOpen(true);
                        }}
                        disabled={admins.length === 1}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover System Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{selectedAdmin?.profiles.email}</strong> dos 
              administradores do sistema? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAdmin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
