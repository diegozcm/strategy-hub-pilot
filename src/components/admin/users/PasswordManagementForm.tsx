import React, { useState } from 'react';
import { Key, Mail, Eye, EyeOff, RefreshCw, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface PasswordManagementFormProps {
  user: { email?: string | null } | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  toast: (props: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
}

export const PasswordManagementForm: React.FC<PasswordManagementFormProps> = ({
  user,
  isLoading,
  setIsLoading,
  toast
}) => {
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

  const handleSubmit = async () => {
    if (!user || !user.email) return;

    setIsLoading(true);
    try {
      const body: any = { 
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
            ? 'Senha temporária enviada para o e-mail do usuário'
            : sendEmail
              ? 'Senha definida e enviada por e-mail'
              : 'Senha definida com sucesso. Comunique a senha ao usuário.'
        });
        
        // Reset form
        setCustomPassword('');
        setShowPassword(false);
      } else {
        throw new Error(data?.message || 'Erro ao resetar senha');
      }
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao resetar senha do usuário',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'auto' | 'manual')}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="auto" id="mode-auto" />
          <Label htmlFor="mode-auto" className="cursor-pointer">
            Gerar senha temporária e enviar por e-mail
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
        <div className="space-y-4 border-l-2 border-primary pl-4 ml-2 mt-4">
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
            <Alert variant="default" className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800 text-sm">
                ⚠️ Você será responsável por comunicar a nova senha ao usuário de forma segura.
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

      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !isPasswordValid}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : mode === 'auto' ? (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Gerar e Enviar Senha Temporária
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Aplicar Nova Senha
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
