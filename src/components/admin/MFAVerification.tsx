import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, ArrowLeft, XCircle, RefreshCw } from 'lucide-react';

export const MFAVerification: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [factors, setFactors] = useState<any[]>([]);
  const [selectedFactorId, setSelectedFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        console.error('Error loading MFA factors:', error);
        setError('Erro ao carregar fatores de autenticação.');
        setLoading(false);
        return;
      }

      // Filter only verified TOTP factors
      const verifiedFactors = data.totp.filter(f => f.status === 'verified');

      if (verifiedFactors.length === 0) {
        // No MFA configured, redirect to admin
        navigate('/app/admin', { replace: true });
        return;
      }

      setFactors(verifiedFactors);
      setSelectedFactorId(verifiedFactors[0].id);
    } catch (err) {
      console.error('Error loading factors:', err);
      setError('Erro inesperado ao carregar autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Digite o código completo de 6 dígitos.');
      return;
    }

    if (!selectedFactorId) {
      setError('Selecione um fator de autenticação.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: selectedFactorId
      });

      if (challengeError) {
        console.error('MFA challenge error:', challengeError);
        setError('Erro ao iniciar verificação. Tente novamente.');
        setVerifying(false);
        return;
      }

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: selectedFactorId,
        challengeId: challengeData.id,
        code: verificationCode
      });

      if (verifyError) {
        console.error('MFA verify error:', verifyError);
        if (verifyError.message.includes('Invalid') || verifyError.message.includes('invalid')) {
          setError('Código inválido. Verifique e tente novamente.');
        } else if (verifyError.message.includes('expired')) {
          setError('Código expirado. Use o código atual do app.');
        } else {
          setError('Erro na verificação. Tente novamente.');
        }
        setVerificationCode('');
        setVerifying(false);
        return;
      }

      toast.success('Verificação concluída!');
      navigate('/app/admin', { replace: true });
    } catch (err) {
      console.error('MFA verification exception:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setVerifying(false);
    }
  };

  const handleBackToLogin = async () => {
    await supabase.auth.signOut();
    navigate('/admin-login', { replace: true });
  };

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (verificationCode.length === 6 && !verifying) {
      handleVerify();
    }
  }, [verificationCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Carregando verificação...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Verificação em duas etapas</CardTitle>
          <CardDescription>
            Digite o código do seu aplicativo autenticador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Abra seu app autenticador e digite o código de 6 dígitos exibido.
            </p>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={(value) => {
                  setVerificationCode(value);
                  setError('');
                }}
                disabled={verifying}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-destructive text-sm">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {verifying && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <LoadingSpinner size="sm" />
                <span className="text-sm">Verificando...</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={handleVerify}
              disabled={verifying || verificationCode.length !== 6}
            >
              {verifying ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </Button>

            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={handleBackToLogin}
              disabled={verifying}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao login
            </Button>
          </div>

          <div className="text-center">
            <button
              onClick={() => setVerificationCode('')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              disabled={verifying}
            >
              <RefreshCw className="h-3 w-3" />
              Limpar código
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
