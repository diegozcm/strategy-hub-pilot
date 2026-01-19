import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, Mail, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { UserWithDetails } from "@/hooks/admin/useUsersStats";
import { UserHeader } from "./shared/UserHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithDetails | null;
  onSuccess: () => void;
}

export function ResetPasswordModal({ open, onOpenChange, user, onSuccess }: ResetPasswordModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [forcePasswordChange, setForcePasswordChange] = useState(true);

  // Password validation
  const passwordValidation = {
    minLength: customPassword.length >= 8,
    hasLetter: /[a-zA-Z]/.test(customPassword),
    hasNumber: /[0-9]/.test(customPassword)
  };

  const isPasswordValid = mode === 'auto' || (
    passwordValidation.minLength &&
    passwordValidation.hasLetter &&
    passwordValidation.hasNumber
  );

  const handleReset = () => {
    setMode('auto');
    setCustomPassword('');
    setShowPassword(false);
    setSendEmail(true);
    setForcePasswordChange(true);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      handleReset();
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!user || !user.email) return;

    setLoading(true);
    try {
      const body: Record<string, any> = {
        email: user.email,
        source: 'admin',
        forcePasswordChange
      };

      if (mode === 'manual') {
        body.customPassword = customPassword;
        body.sendEmail = sendEmail;
      } else {
        body.sendEmail = true;
      }

      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Sucesso',
          description: mode === 'auto'
            ? 'Senha temporária gerada e enviada para o e-mail do usuário.'
            : sendEmail
              ? 'Senha definida e enviada por e-mail.'
              : 'Senha definida com sucesso. Comunique a senha ao usuário.'
        });

        onSuccess();
        handleClose(false);
      } else {
        throw new Error(data?.message || 'Erro ao resetar senha');
      }
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao resetar senha do usuário.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gerar Nova Senha
          </DialogTitle>
          <DialogDescription>
            Defina uma nova senha para o usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted rounded-lg">
            <UserHeader user={user} size="sm" showStatus={false} />
          </div>

          <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'auto' | 'manual')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto" id="mode-auto" />
              <Label htmlFor="mode-auto" className="cursor-pointer">
                Gerar senha temporária automaticamente
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="mode-manual" />
              <Label htmlFor="mode-manual" className="cursor-pointer">
                Definir senha manualmente
              </Label>
            </div>
          </RadioGroup>

          {mode === 'manual' && (
            <div className="space-y-4 border-l-2 border-primary pl-4 ml-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <p className="text-muted-foreground mb-2">Requisitos da senha:</p>
                <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordValidation.minLength ? '✓' : '○'} Mínimo 8 caracteres
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasLetter ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordValidation.hasLetter ? '✓' : '○'} Pelo menos 1 letra
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordValidation.hasNumber ? '✓' : '○'} Pelo menos 1 número
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-email"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                />
                <Label htmlFor="send-email" className="cursor-pointer">
                  Enviar nova senha por e-mail
                </Label>
              </div>

              {!sendEmail && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-sm">
                    Você será responsável por comunicar a nova senha ao usuário de forma segura.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="force-change"
              checked={forcePasswordChange}
              onCheckedChange={(checked) => setForcePasswordChange(checked as boolean)}
            />
            <Label htmlFor="force-change" className="cursor-pointer">
              Forçar alteração de senha no próximo login
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !isPasswordValid}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : mode === 'auto' ? (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Gerar e Enviar
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Aplicar Senha
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}