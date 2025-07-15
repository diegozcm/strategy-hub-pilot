
import React, { useState, useEffect } from 'react';
import { Zap, Eye, EyeOff, Mail, Lock, Target, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useMultiTenant';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Separator } from '@/components/ui/separator';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else if (error.message.includes('User already registered')) {
          setError('Este email já está cadastrado');
        } else {
          setError(error.message);
        }
      } else if (!isLogin) {
        setError('Cadastro realizado! Verifique seu email para confirmar a conta.');
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Check for pending status
  useEffect(() => {
    if (profile?.status === 'pending') {
      setError('Sua conta está pendente de aprovação. Aguarde a liberação por um administrador.');
    }
  }, [profile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-2xl mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StrategyHub</h1>
          <p className="text-gray-600 mt-2">Gestão Estratégica Inteligente</p>
        </div>

        {/* Auth Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? 'Acesse sua conta para continuar' 
                : 'Crie sua conta para começar'
              }
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

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                {isLogin ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>

            <div className="my-6">
              <Separator />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Ou continue com</span>
                </div>
              </div>
            </div>

            {!isLogin && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Após o cadastro, sua conta ficará pendente de aprovação por um administrador do sistema.
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {isLogin 
                  ? 'Não tem conta? Criar conta' 
                  : 'Já tem conta? Fazer login'
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Acesso Admin */}
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Shield className="h-5 w-5 text-amber-600 mr-2" />
              <h3 className="text-sm font-semibold text-amber-800">Acesso Administrativo</h3>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              Para demonstração, use as credenciais abaixo para acessar o sistema como administrador:
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setEmail('admin@sistema.com');
                  setPassword('admin123');
                  setIsLogin(true);
                }}
                variant="outline"
                size="sm"
                className="w-full text-xs border-amber-300 hover:bg-amber-100"
              >
                🔑 Admin Sistema (admin@sistema.com)
              </Button>
              <Button
                onClick={() => {
                  setEmail('gestor@empresa.com');
                  setPassword('gestor123');
                  setIsLogin(true);
                }}
                variant="outline"
                size="sm"
                className="w-full text-xs border-amber-300 hover:bg-amber-100"
              >
                👤 Gestor Empresa (gestor@empresa.com)
              </Button>
            </div>
            <p className="text-xs text-amber-600 mt-3">
              * Estas contas serão criadas automaticamente no primeiro login
            </p>
          </CardContent>
        </Card>

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
