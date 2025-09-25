import React, { useState } from 'react';
import { Eye, EyeOff, Key, Mail, Lock } from 'lucide-react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Validation schemas
const emailSchema = z.string()
  .trim()
  .email({ message: "Email inválido" })
  .max(255, { message: "Email deve ter menos de 255 caracteres" });

const passwordSchema = z.string()
  .min(8, { message: "Senha deve ter pelo menos 8 caracteres" })
  .regex(/[A-Z]/, { message: "Senha deve conter pelo menos uma letra maiúscula" })
  .regex(/[a-z]/, { message: "Senha deve conter pelo menos uma letra minúscula" })
  .regex(/[0-9]/, { message: "Senha deve conter pelo menos um número" })
  .regex(/[^A-Za-z0-9]/, { message: "Senha deve conter pelo menos um caractere especial" });

interface PasswordChangeFormProps {
  isAdmin?: boolean;
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Step 1: Request token
  const [email, setEmail] = useState(user?.email || '');
  const [isRequestingToken, setIsRequestingToken] = useState(false);
  const [tokenRequested, setTokenRequested] = useState(false);

  // Step 2: Change password with token
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleRequestToken = async () => {
    if (!email.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, confirme seu email',
        variant: 'destructive',
      });
      return;
    }

    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      toast({
        title: 'Erro',
        description: emailValidation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsRequestingToken(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { 
          email: email.trim(),
          source: "settings" // Indicate this is from settings page (logged-in user)
        }
      });

      if (error) {
        console.error('Reset password function error:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao processar solicitação. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      if (!data?.success) {
        toast({
          title: 'Erro',
          description: data?.message || 'Erro ao processar solicitação.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Token enviado!',
        description: 'Verifique seu email e insira o token recebido abaixo.',
      });
      
      setTokenRequested(true);
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Algo deu errado. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsRequestingToken(false);
    }
  };

  const handleChangePassword = async () => {
    if (!token.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira o token recebido por email',
        variant: 'destructive',
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos de senha',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'Nova senha e confirmação não coincidem',
        variant: 'destructive',
      });
      return;
    }

    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      toast({
        title: 'Senha inválida',
        description: passwordValidation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('change-password-logged-in', {
        body: { 
          token: token.trim(),
          newPassword,
          confirmPassword
        }
      });

      if (error) {
        console.error('Change password function error:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao alterar senha. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      if (!data?.success) {
        toast({
          title: 'Erro',
          description: data?.message || 'Erro ao alterar senha.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso!',
        description: 'Senha alterada com sucesso!',
      });
      
      // Reset form
      setToken('');
      setNewPassword('');
      setConfirmPassword('');
      setTokenRequested(false);
      
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Algo deu errado. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleStartOver = () => {
    setTokenRequested(false);
    setToken('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-4">
      {/* Change Your Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Alterar Minha Senha</span>
          </CardTitle>
          <CardDescription>
            {!tokenRequested 
              ? "Solicite um token de segurança para alterar sua senha de forma segura"
              : "Insira o token recebido por email e defina sua nova senha"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!tokenRequested ? (
            // Step 1: Request token
            <>
              <div>
                <Label htmlFor="email-confirm">Confirme seu email</Label>
                <Input
                  id="email-confirm"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleRequestToken} 
                disabled={!email.trim() || isRequestingToken}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isRequestingToken ? 'Enviando token...' : 'Solicitar Token de Segurança'}
              </Button>
            </>
          ) : (
            // Step 2: Change password with token
            <>
              <div>
                <Label htmlFor="security-token">Token de Segurança</Label>
                <Input
                  id="security-token"
                  type="text"
                  placeholder="Insira o token recebido por email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Digite sua nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme sua nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>A senha deve conter:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Pelo menos 8 caracteres</li>
                  <li>Uma letra maiúscula</li>
                  <li>Uma letra minúscula</li>
                  <li>Um número</li>
                  <li>Um caractere especial</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleChangePassword} 
                  disabled={!token.trim() || !newPassword || !confirmPassword || isChangingPassword}
                  className="flex-1"
                >
                  <Key className="h-4 w-4 mr-2" />
                  {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleStartOver}
                  disabled={isChangingPassword}
                >
                  Recomeçar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Admin Reset Card (only for admins) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Reset de Senha (Admin)</span>
            </CardTitle>
            <CardDescription>
              Como administrador, você também pode redefinir senhas de outros usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Para redefinir a senha de outros usuários, vá para a aba "Usuários" acima.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};