import { useState } from "react";
import { ShieldCheck, UserPlus, Trash2, Loader2, Search, Crown } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminUser {
  user_id: string;
  role_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function SystemAdminsSettingsPage() {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const { data: admins, isLoading } = useQuery({
    queryKey: ["system-admins-list"],
    queryFn: async (): Promise<AdminUser[]> => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("id, user_id, created_at")
        .eq("role", "admin");

      if (error) throw error;
      if (!roles?.length) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return roles.map((r) => {
        const p = profileMap.get(r.user_id);
        return {
          user_id: r.user_id,
          role_id: r.id,
          first_name: p?.first_name || null,
          last_name: p?.last_name || null,
          email: p?.email || null,
          avatar_url: p?.avatar_url || null,
          created_at: r.created_at,
        };
      });
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id;
    },
  });

  const addAdmin = useMutation({
    mutationFn: async (email: string) => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error("Usuário não encontrado com este e-mail");

      // Check if already admin
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("role", "admin")
        .maybeSingle();

      if (existing) throw new Error("Este usuário já é administrador");

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: profile.user_id, role: "admin" as any });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Administrador adicionado!");
      queryClient.invalidateQueries({ queryKey: ["system-admins-list"] });
      setAddDialogOpen(false);
      setNewAdminEmail("");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const removeAdmin = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Administrador removido");
      queryClient.invalidateQueries({ queryKey: ["system-admins-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const filteredAdmins = admins?.filter((a) => {
    if (!searchEmail) return true;
    const name = `${a.first_name || ""} ${a.last_name || ""} ${a.email || ""}`.toLowerCase();
    return name.includes(searchEmail.toLowerCase());
  });

  return (
    <AdminPageContainer title="Admins do Sistema" description="Gerencie os administradores do sistema">
      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Administradores
                </CardTitle>
                <CardDescription className="mt-1">
                  {admins?.length ?? 0} administradores do sistema
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Buscar..."
                    className="pl-9 w-48"
                  />
                </div>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Administrador</DialogTitle>
                      <DialogDescription>
                        Informe o e-mail do usuário que receberá permissões de administrador do sistema.
                      </DialogDescription>
                    </DialogHeader>
                    <Input
                      type="email"
                      placeholder="email@empresa.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
                      <Button
                        onClick={() => addAdmin.mutate(newAdminEmail)}
                        disabled={!newAdminEmail.trim() || addAdmin.isPending}
                      >
                        {addAdmin.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirmar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : !filteredAdmins?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Nenhum administrador encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.role_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={admin.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {(admin.first_name?.[0] || admin.email?.[0] || "?").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {admin.first_name || admin.last_name
                                ? `${admin.first_name || ""} ${admin.last_name || ""}`.trim()
                                : "Sem nome"}
                            </span>
                            {admin.user_id === currentUser && (
                              <Badge variant="outline" className="text-xs"><Crown className="h-3 w-3 mr-1" />Você</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{admin.email || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(admin.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {admin.user_id !== currentUser && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Administrador?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {admin.first_name || admin.email} perderá acesso ao painel administrativo do sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => removeAdmin.mutate(admin.role_id)}
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
