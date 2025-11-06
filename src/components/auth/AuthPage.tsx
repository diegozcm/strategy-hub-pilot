import React, { useState, useEffect } from 'react';
import { Zap, Eye, EyeOff, Mail, Lock, Target, BarChart3, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useMultiTenant';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { logStep, startAttempt, endAttempt } from '@/lib/loginTrace';

// Password validation schema
const passwordSchema = z.string()
  .min(6, { message: "Senha deve ter pelo menos 6 caracteres" })
  .max(50, { message: "Senha deve ter menos de 50 caracteres" });

export const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { signInNormalUser, user, profile, company, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Check if this is a password reset
  const isPasswordReset = searchParams.get('mode') === 'reset';
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  // Log component mount
  useEffect(() => {
    logStep('AuthPage:mount', { 
      route: location.pathname, 
      isPasswordReset, 
      hasTokens: !!(accessToken && refreshToken) 
    });
  }, []);

  useEffect(() => {
    // Handle password reset session
    if (isPasswordReset && accessToken && refreshToken) {
      logStep('AuthPage:reset:setSession:start');
      supabase.auth.setSession({ 
        access_token: accessToken, 
        refresh_token: refreshToken 
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting session for password reset:', error);
          setError('Link de reset inválido ou expirado. Solicite um novo reset.');
          logStep('AuthPage:reset:setSession:error', { errorMessage: error.message });
        } else {
          logStep('AuthPage:reset:setSession:done');
        }
      });
      return;
    }

    // Always log the navigation gate check
    logStep('AuthPage:navigation:check', {
      isPasswordReset,
      authLoading,
      hasUser: !!user,
      hasProfile: !!profile,
      profileStatus: profile?.status,
      hasCompany: !!company,
      currentPath: location.pathname
    });

    // Navigate only when ALL data is loaded (including auth loading complete)
    if (!isPasswordReset && !authLoading && user && profile && profile.status === 'active') {
      if (company) {
        logStep('AuthPage:navigation:go', { to: '/app/dashboard' });
        endAttempt('success', { destination: '/app/dashboard' });
        navigate('/app/dashboard', { replace: true });
      } else {
        logStep('AuthPage:navigation:go', { to: '/company-selection' });
        endAttempt('success', { destination: '/company-selection' });
        navigate('/company-selection', { replace: true });
      }
    } else {
      // Log why navigation is blocked
      const blockReasons = [];
      if (isPasswordReset) blockReasons.push('password_reset');
      if (authLoading) blockReasons.push('auth_loading');
      if (!user) blockReasons.push('no_user');
      if (!profile) blockReasons.push('no_profile');
      if (profile && profile.status !== 'active') blockReasons.push(`profile_${profile.status}`);
      
      if (blockReasons.length > 0) {
        logStep('AuthPage:navigation:blocked', { reasons: blockReasons });
      }
    }
    
    // Handle inactive profile
    if (profile && profile.status === 'inactive') {
      setError('Sua conta foi desativada. Entre em contato com um administrador.');
      endAttempt('error', { reason: 'inactive_profile' });
    }
  }, [user, profile, company, authLoading, navigate, isPasswordReset, accessToken, refreshToken, location.pathname]);

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setError(passwordValidation.error.errors[0].message);
      setLoading(false);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        setError('Erro ao atualizar senha. Tente novamente.');
        return;
      }

      toast({
        title: 'Senha atualizada!',
        description: 'Sua senha foi alterada com sucesso.',
      });

      // Clear the URL parameters and redirect to login
      navigate('/auth', { replace: true });
      
    } catch (error: any) {
      console.error('Unexpected error:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('login-with-reset', {
        body: { email: email.trim() }
      });

      if (error) {
        console.error('Forgot password function error:', error);
        setError('Erro ao processar solicitação. Tente novamente.');
        return;
      }

      if (!data?.success) {
        setError(data?.message || 'Erro ao processar solicitação.');
        return;
      }

      toast({
        title: 'Instruções enviadas!',
        description: data.message,
      });
      
      setShowForgotPassword(false);
      setEmail('');
    } catch (error: any) {
      console.error('Unexpected error:', error);
      setError('Erro inesperado. Tente novamente mais tarde.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const attemptId = startAttempt({ channel: 'auth', type: 'normal' });
    logStep('AuthPage:submit:start', { email }, attemptId);

    try {
      const result = await signInNormalUser(email, password);
      
      logStep('AuthPage:submit:result', { 
        ok: !result.error, 
        errorCode: (result.error as any)?.code,
        errorMessage: result.error?.message 
      }, attemptId);
      
      if (result.error) {
        setLoading(false);
        
        // Check if System Admin was blocked
        if ((result.error as any).code === 'admin_blocked') {
          setError('Acesso negado. Administradores devem usar o login administrativo.');
          endAttempt('error', { reason: 'admin_blocked' }, attemptId);
          return;
        }
        
        if (result.error.message?.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos.');
          endAttempt('error', { reason: 'invalid_credentials' }, attemptId);
        } else if (result.error.message?.includes('User not found')) {
          setError('Usuário não encontrado. Entre em contato com o administrador.');
          endAttempt('error', { reason: 'user_not_found' }, attemptId);
        } else {
          setError(result.error.message);
          endAttempt('error', { reason: 'other', message: result.error.message }, attemptId);
        }
      }
      // Loading stays active until useEffect navigates
    } catch (error: any) {
      setLoading(false);
      setError('Ocorreu um erro inesperado. Tente novamente.');
      logStep('AuthPage:submit:exception', { error: error?.message });
      endAttempt('error', { reason: 'exception', message: error?.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Target className="h-8 w-8 text-primary mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Start Together</h1>
          <p className="text-muted-foreground mt-2">Gestão Estratégica Inteligente</p>
        </div>

        {/* Auth Form */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {isPasswordReset ? (
                <div className="flex items-center justify-center gap-2">
                  <Key className="h-6 w-6 text-primary" />
                  Redefinir Senha
                </div>
              ) : (
                'Entrar no Sistema'
              )}
            </CardTitle>
            <CardDescription className="text-center">
              {isPasswordReset 
                ? 'Digite sua nova senha abaixo'
                : 'Entre com suas credenciais para acessar o Start Together'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isPasswordReset ? (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nova senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmar nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
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

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Atualizar Senha
                    </>
                  )}
                </Button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    ← Voltar para login
                  </button>
                </div>
              </form>
            ) : (
              <>
                {showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={forgotPasswordLoading}>
                      {forgotPasswordLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar Instruções
                        </>
                      )}
                    </Button>

                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setError('');
                          setEmail('');
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        ← Voltar para login
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Entrando...
                        </>
                      ) : (
                        'Entrar no Sistema'
                      )}
                    </Button>

                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setError('');
                          setPassword('');
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Esqueci minha senha →
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {!isPasswordReset && (
              <>
                <div className="my-6">
                  <Separator />
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Não tem acesso? Entre em contato com o administrador do sistema.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Admin Access Link */}
        {!isPasswordReset && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/admin-login')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Acesso Administrativo →
            </button>
          </div>
        )}

        {/* Features */}
        {!isPasswordReset && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-1 text-blue-600" />
                <span>OKRs</span>
              </div>
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-1 text-blue-600" />
                <span>Dashboards</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-1 text-blue-600" />
                <span>IA Insights</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};