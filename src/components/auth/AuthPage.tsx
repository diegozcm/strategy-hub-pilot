import React, { useState, useEffect } from 'react';
import { Zap, Eye, EyeOff, Mail, Lock, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useMultiTenant';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Separator } from '@/components/ui/separator';

export const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      // Check if profile is inactive
      if (profile.status === 'inactive') {
        setError('Sua conta foi desativada. Entre em contato com um administrador.');
        return;
      }
      
      // Redirect active users
      if (profile.status === 'active') {
        if (profile.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/app');
        }
      }
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        if (result.error.message?.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos.');
        } else if (result.error.message?.includes('User not found')) {
          setError('Usuário não encontrado. Entre em contato com o administrador.');
        } else {
          setError(result.error.message);
        }
      }
    } catch (error: any) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-2xl mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Start Together</h1>
          <p className="text-gray-600 mt-2">Gestão Estratégica Inteligente</p>
        </div>

        {/* Auth Form */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Entrar no Sistema
            </CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o Start Together
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            </form>

            <div className="my-6">
              <Separator />
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Não tem acesso? Entre em contato com o administrador do sistema.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Access Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin-login')}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Acesso Administrativo →
          </button>
        </div>

        {/* Features */}
        <div className="mt-8 text-center text-sm text-gray-600">
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
      </div>
    </div>
  );
};