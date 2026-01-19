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
import { Loader2, UserX, UserCheck } from "lucide-react";
import { UserWithDetails } from "@/hooks/admin/useUsersStats";
import { UserHeader } from "./shared/UserHeader";
import { ActionConfirmation } from "./shared/ActionConfirmation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithDetails | null;
  action: 'deactivate' | 'reactivate';
  onSuccess: () => void;
}

export function UserStatusModal({ open, onOpenChange, user, action, onSuccess }: UserStatusModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const newStatus = action === 'deactivate' ? 'inactive' : 'active';

      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: action === 'deactivate'
          ? `${user.first_name} foi desativado com sucesso.`
          : `${user.first_name} foi reativado com sucesso.`
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status do usuário.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isDeactivate = action === 'deactivate';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDeactivate ? (
              <><UserX className="h-5 w-5 text-destructive" /> Desativar Usuário</>
            ) : (
              <><UserCheck className="h-5 w-5 text-green-600" /> Reativar Usuário</>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                {isDeactivate 
                  ? 'Tem certeza que deseja desativar este usuário?' 
                  : 'Deseja reativar o acesso deste usuário ao sistema?'}
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <UserHeader user={user} size="sm" showStatus={false} />
              </div>
              <ActionConfirmation
                title={isDeactivate ? 'Consequências da desativação:' : 'Ao reativar:'}
                variant={isDeactivate ? 'warning' : 'success'}
                bulletPoints={isDeactivate ? [
                  'O usuário perderá acesso ao sistema',
                  'Sessões ativas serão encerradas',
                  'Dados do usuário serão preservados'
                ] : [
                  'O usuário poderá acessar o sistema novamente',
                  'Permissões anteriores serão restauradas',
                  'Uma nova senha pode ser necessária'
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
            variant={isDeactivate ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading}
            className={!isDeactivate ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {isDeactivate ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                {isDeactivate ? 'Desativar' : 'Reativar'}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}