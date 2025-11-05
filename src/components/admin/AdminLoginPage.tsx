
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useMultiTenant';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useIsSystemAdmin } from '@/hooks/useIsSystemAdmin';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, loading: authLoading } = useAuth();
  const { data: isSystemAdmin, isLoading: adminCheckLoading } = useIsSystemAdmin();
  const navigate = useNavigate();

  // Aguardar o contexto user ficar disponível e validar permissões de admin
  useEffect(() => {
    if (user && !authLoading && !adminCheckLoading && loading) {
      console.log('✅ User context ready, checking admin status...');
      
      if (isSystemAdmin) {
        console.log('✅ User is admin, navigating to admin panel');
        navigate('/app/admin', { replace: true });
      } else {
        console.log('❌ User is NOT admin, blocking access');
        setError('Você não tem permissões de administrador. Entre com uma conta admin.');
        setLoading(false);
        
        // Fazer logout para limpar a sessão
        supabase.auth.signOut();
      }
    }
  }, [user, authLoading, adminCheckLoading, isSystemAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Credenciais inválidas. Verifique seu email e senha.');
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }
      
      // Não navegar imediatamente - aguardar o useEffect detectar user
      console.log('✅ Login successful, waiting for user context...');
    } catch (err) {
      setError('Erro ao tentar fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
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
                placeholder="Digite seu email"
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
