import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Mail, Key, AlertTriangle, RefreshCw } from "lucide-react";
import { UserWithDetails } from "@/hooks/admin/useUsersStats";
import { UserHeader } from "./shared/UserHeader";
import { ActionConfirmation } from "./shared/ActionConfirmation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResendCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithDetails | null;
  onSuccess: () => void;
}

interface TempPasswordInfo {
  hasValidPassword: boolean;
  token: string | null;
  expiresAt: string | null;
}

export function ResendCredentialsModal({ open, onOpenChange, user, onSuccess }: ResendCredentialsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [passwordInfo, setPasswordInfo] = useState<TempPasswordInfo | null>(null);
  const [generateNew, setGenerateNew] = useState(false);

  useEffect(() => {
    if (open && user) {
      checkExistingPassword();
      setGenerateNew(false);
    } else {
      setPasswordInfo(null);
    }
  }, [open, user]);

  const checkExistingPassword = async () => {
    if (!user) return;
    setCheckingPassword(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('temp_reset_token, temp_reset_expires')
        .eq('user_id', user.user_id)
        .single();

      if (error) throw error;

      const isValid = data.temp_reset_token && 
        data.temp_reset_expires && 
        new Date(data.temp_reset_expires) > new Date();

      setPasswordInfo({
        hasValidPassword: isValid,
        token: data.temp_reset_token,
        expiresAt: data.temp_reset_expires
      });
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      setPasswordInfo({ hasValidPassword: false, token: null, expiresAt: null });
    } finally {
      setCheckingPassword(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !user.email) return;

    setLoading(true);
    try {
      let passwordToSend = passwordInfo?.token;

      // If no valid password or user wants to generate new
      if (!passwordInfo?.hasValidPassword || generateNew) {
        // Generate new password
        const { data: resetData, error: resetError } = await supabase.functions.invoke('reset-user-password', {
          body: {
            email: user.email,
            source: 'admin',
            sendEmail: false,
            forcePasswordChange: true
          }
        });

        if (resetError) throw resetError;

        // Fetch the new token
        const { data: updatedProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('temp_reset_token, first_name, last_name')
          .eq('user_id', user.user_id)
          .single();

        if (fetchError) throw fetchError;
        passwordToSend = updatedProfile.temp_reset_token;
      }

      // Send credentials email
      const { data, error } = await supabase.functions.invoke('send-user-credentials', {
        body: {
          to: user.email,
          userName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuário',
          email: user.email,
          temporaryPassword: passwordToSend,
          companyName: user.company_name || 'Sistema'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Sucesso',
          description: 'Credenciais enviadas para o e-mail do usuário.'
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(data?.message || 'Erro ao enviar credenciais');
      }
    } catch (error: any) {
      console.error('Erro ao reenviar credenciais:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao reenviar credenciais.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Reenviar Credenciais
          </DialogTitle>
          <DialogDescription>
            Envie as credenciais de acesso para o e-mail do usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted rounded-lg">
            <UserHeader user={user} size="sm" showStatus={false} />
          </div>

          {checkingPassword ? (
            <Skeleton className="h-20 w-full" />
          ) : passwordInfo?.hasValidPassword ? (
            <div className="space-y-3">
              <ActionConfirmation
                title="Senha temporária ativa"
                description="Este usuário possui uma senha temporária válida que será reenviada."
                variant="success"
              />
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-new"
                  checked={generateNew}
                  onCheckedChange={(checked) => setGenerateNew(checked as boolean)}
                />
                <Label htmlFor="generate-new" className="cursor-pointer text-sm">
                  Gerar nova senha ao invés de reenviar a existente
                </Label>
              </div>
            </div>
          ) : (
            <ActionConfirmation
              title="Nenhuma senha temporária ativa"
              description="Uma nova senha temporária será gerada e enviada por e-mail."
              variant="warning"
              bulletPoints={[
                'Uma nova senha será criada automaticamente',
                'O usuário deverá trocar a senha no primeiro acesso'
              ]}
            />
          )}

          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg text-sm">
            <Mail className="h-4 w-4 text-primary" />
            <span>As credenciais serão enviadas para: <strong>{user.email}</strong></span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || checkingPassword}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Credenciais
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}