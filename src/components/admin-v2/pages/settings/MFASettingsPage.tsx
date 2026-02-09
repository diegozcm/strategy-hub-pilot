import { useState } from "react";
import { Smartphone, Shield, Trash2, Loader2, Users, AlertTriangle, RefreshCw } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDateTimeBrazil } from "@/lib/dateUtils";

interface MFAUser {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

export default function MFASettingsPage() {
  const queryClient = useQueryClient();

  const { data: mfaUsers = [], isLoading } = useQuery({
    queryKey: ["admin-mfa-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .order("first_name");

      if (error) throw error;
      return (data || []) as MFAUser[];
    },
  });

  // Count users with MFA (we'd need a server function for real data)
  const { data: mfaStats } = useQuery({
    queryKey: ["admin-mfa-stats"],
    queryFn: async () => {
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      return {
        totalUsers: totalUsers || 0,
      };
    },
  });

  const removeMFAMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Remove MFA factors for a specific user using admin SQL
      const { error } = await supabase.rpc("admin_remove_mfa_factors" as any, {
        target_user_id: userId,
      });
      if (error) {
        // Fallback: direct delete if RPC doesn't exist
        const { error: deleteError } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("user_id", userId)
          .single();
        if (deleteError) throw deleteError;
        throw new Error("Função admin_remove_mfa_factors não encontrada. Configure via SQL.");
      }
    },
    onSuccess: () => {
      toast.success("MFA removido com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-mfa-users"] });
    },
    onError: (err: Error) => {
      toast.error("Erro ao remover MFA: " + err.message);
    },
  });

  return (
    <AdminPageContainer title="Autenticação MFA" description="Configurações › Segurança › MFA">
      <div className="max-w-4xl space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mfaStats?.totalUsers ?? "..."}</p>
                  <p className="text-xs text-muted-foreground">Usuários Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">TOTP</p>
                  <p className="text-xs text-muted-foreground">Método Suportado</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">App Auth</p>
                  <p className="text-xs text-muted-foreground">Google/Authy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            O MFA (Multi-Factor Authentication) é configurado por cada usuário individualmente através do seu perfil. 
            Como administrador, você pode <strong>remover o MFA</strong> de um usuário caso ele perca acesso ao dispositivo autenticador.
            A ativação obrigatória do MFA para todos os usuários pode ser configurada via política do Supabase.
          </AlertDescription>
        </Alert>

        {/* User list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gerenciamento de MFA por Usuário
              </CardTitle>
              <CardDescription>
                Visualize e gerencie a autenticação de dois fatores dos usuários
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-mfa-users"] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : mfaUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="space-y-1">
                {mfaUsers.map((user, idx) => (
                  <div key={user.user_id}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {(user.first_name || user.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{[user.first_name, user.last_name].filter(Boolean).join(" ") || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Usuário
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remover MFA
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover MFA</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover a autenticação de dois fatores de{" "}
                                <strong>{[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}</strong>? 
                                O usuário precisará configurar o MFA novamente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeMFAMutation.mutate(user.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover MFA
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {idx < mfaUsers.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
