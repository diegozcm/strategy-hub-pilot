import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Mail, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useMultiTenant';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, user, profile, isSystemAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      console.log('🔍 Admin Login - Checking permissions:', { user: user.email, role: profile.role, isSystemAdmin });
      
      if (isSystemAdmin || profile.role === 'admin') {
        console.log('✅ Admin access granted, redirecting to /admin');
        navigate('/admin');
      } else {
        console.log('❌ Admin access denied, user role:', profile.role);
        setError('Acesso negado. Esta área é restrita a administradores.');
      }
    }
  }, [user, profile, isSystemAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use supabase auth directly to avoid the hardcoded redirect to /app
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Credenciais administrativas inválidas');
        } else {
          setError(error.message);
        }
      }
      // Don't redirect here - let the useEffect handle it after profile is loaded
    } catch (err) {
      setError('Erro ao tentar fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@example.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 p-3 rounded-2xl mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
          <p className="text-slate-300 mt-2">Acesso Administrativo do Sistema</p>
        </div>

        {/* Warning Notice */}
        <div className="mb-6 p-4 bg-red-900/50 border border-red-600/50 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-red-200">Área Restrita</h3>
              <p className="text-xs text-red-300 mt-1">
                Acesso permitido apenas para administradores autorizados
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-white">
              Login Administrativo
            </CardTitle>
            <CardDescription className="text-center text-slate-300">
              Digite suas credenciais de administrador
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha administrativa"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg border border-red-600/30">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Acessar Painel Administrativo
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-4 border-t border-slate-600">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-3">Para demonstração:</p>
                <Button
                  onClick={fillAdminCredentials}
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-600 bg-slate-700/30 text-slate-300 hover:bg-slate-600/50"
                >
                  🔑 Usar Credenciais Demo
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/auth')}
                className="text-sm text-slate-400 hover:text-slate-300"
              >
                ← Voltar ao login normal
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};