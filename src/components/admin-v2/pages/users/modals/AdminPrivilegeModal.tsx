import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, ShieldOff, ShieldCheck } from "lucide-react";
import { UserWithDetails } from "@/hooks/admin/useUsersStats";
import { UserHeader } from "./shared/UserHeader";
import { ActionConfirmation } from "./shared/ActionConfirmation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminPrivilegeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithDetails | null;
  action: 'promote' | 'demote';
  onSuccess: () => void;
}

export function AdminPrivilegeModal({ open, onOpenChange, user, action, onSuccess }: AdminPrivilegeModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (action === 'promote') {
        // Check if already admin
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('role', 'admin')
          .single();

        if (existingRole) {
          toast({
            title: 'Aviso',
            description: 'Este usuário já é um administrador do sistema.',
            variant: 'destructive'
          });
          onOpenChange(false);
          return;
        }

        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.user_id, role: 'admin' });

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: `${user.first_name} foi promovido a administrador do sistema.`
        });
      } else {
        // Check if this is the last admin
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');

        if (count && count <= 1) {
          toast({
            title: 'Operação não permitida',
            description: 'Não é possível remover o último administrador do sistema.',
            variant: 'destructive'
          });
          onOpenChange(false);
          return;
        }

        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.user_id)
          .eq('role', 'admin');

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: `Privilégio de administrador removido de ${user.first_name}.`
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao alterar privilégio:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar privilégio do usuário.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isPromote = action === 'promote';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isPromote ? (
              <><ShieldCheck className="h-5 w-5 text-amber-600" /> Promover a Administrador</>
            ) : (
              <><ShieldOff className="h-5 w-5 text-destructive" /> Remover Privilégio de Admin</>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                {isPromote
                  ? 'Tem certeza que deseja conceder privilégios de administrador a este usuário?'
                  : 'Tem certeza que deseja remover os privilégios de administrador deste usuário?'}
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <UserHeader user={user} size="sm" showAdmin={false} />
              </div>
              <ActionConfirmation
                title={isPromote ? 'Poderes de administrador:' : 'Ao remover privilégios:'}
                variant={isPromote ? 'warning' : 'destructive'}
                bulletPoints={isPromote ? [
                  'Acesso total ao painel administrativo',
                  'Gerenciamento de usuários e empresas',
                  'Acesso a configurações do sistema',
                  'Visualização de logs e métricas',
                  'Controle de backups e restaurações'
                ] : [
                  'O usuário perderá acesso ao painel admin',
                  'Não poderá mais gerenciar outros usuários',
                  'Acesso limitado às funcionalidades normais',
                  'Esta ação pode ser revertida'
                ]}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={isPromote ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={loading}
            className={isPromote ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {isPromote ? <Shield className="h-4 w-4 mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
                {isPromote ? 'Promover a Admin' : 'Remover Privilégio'}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}