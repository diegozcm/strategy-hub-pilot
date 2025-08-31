
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useMultiTenant';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AdminLoginPage - Auth state:', { user: !!user, profile, authLoading });
    
    if (!authLoading && user) {
      if (profile) {
        console.log('AdminLoginPage - User and profile loaded:', { userRole: profile.role });
        if (profile.role === 'admin') {
          console.log('AdminLoginPage - Redirecting to admin dashboard');
          navigate('/app/admin');
        } else {
          console.log('AdminLoginPage - User is not admin, staying on login page');
          setError('Acesso negado. Apenas administradores podem acessar esta área.');
        }
      } else {
        // Profile não carregou ainda, mas usuário está logado - verificar por email
        console.log('AdminLoginPage - Profile not loaded, checking user email:', user.email);
        if (user.email === 'admin@example.com' || user.email === 'diego@cofound.com.br') {
          console.log('AdminLoginPage - Admin email detected, redirecting...');
          navigate('/app/admin');
        } else {
          // Aguardar um pouco mais pelo profile
          setTimeout(() => {
            if (!profile) {
              console.log('AdminLoginPage - Profile still not loaded after timeout');
              setError('Erro ao carregar perfil do usuário. Tente novamente.');
            }
          }, 3000);
        }
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('AdminLoginPage - Attempting login for:', email);
      
      // Use supabase auth directly to avoid the hardcoded redirect to /app
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AdminLoginPage - Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setError('Credenciais inválidas. Verifique seu email e senha.');
        } else {
          setError(error.message);
        }
        return;
      }

      console.log('AdminLoginPage - Login successful:', !!data.user);
      
      // Don't redirect here - let the useEffect handle it after profile is loaded
    } catch (err) {
      console.error('AdminLoginPage - Unexpected error:', err);
      setError('Erro ao tentar fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is already logged in and is admin, don't show login form
  if (user && profile?.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais de administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
