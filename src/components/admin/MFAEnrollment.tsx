import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Shield, Smartphone, CheckCircle2, XCircle } from 'lucide-react';

interface MFAEnrollmentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const MFAEnrollment: React.FC<MFAEnrollmentProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    startEnrollment();
  }, []);

  const startEnrollment = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) {
        console.error('MFA enrollment error:', error);
        setError('Erro ao iniciar configuração do 2FA. Tente novamente.');
        setLoading(false);
        return;
      }

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
      }
    } catch (err) {
      console.error('MFA enrollment exception:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndActivate = async () => {
    if (verificationCode.length !== 6) {
      setError('Digite o código completo de 6 dígitos.');
      return;
    }

    if (!factorId) {
      setError('Fator de autenticação não encontrado. Reinicie o processo.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      // Challenge the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) {
        console.error('MFA challenge error:', challengeError);
        setError('Erro ao verificar. Tente novamente.');
        setVerifying(false);
        return;
      }

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode
      });

      if (verifyError) {
        console.error('MFA verify error:', verifyError);
        if (verifyError.message.includes('Invalid')) {
          setError('Código inválido. Verifique e tente novamente.');
        } else {
          setError('Erro na verificação. Tente novamente.');
        }
        setVerifying(false);
        return;
      }

      toast.success('Autenticação de dois fatores ativada com sucesso!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/app/admin', { replace: true });
      }
    } catch (err) {
      console.error('MFA verification exception:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = async () => {
    // Unenroll the pending factor if exists
    if (factorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch (err) {
        console.error('Error unenrolling factor:', err);
      }
    }

    if (onCancel) {
      onCancel();
    } else {
      navigate('/app/admin', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Preparando configuração do 2FA...</p>
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Configurar 2FA</CardTitle>
          <CardDescription>
            Proteja sua conta com autenticação de dois fatores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: QR Code */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium">Escaneie o QR Code</p>
                <p className="text-xs text-muted-foreground">
                  Abra o Google Authenticator ou outro app compatível e escaneie o código abaixo.
                </p>
              </div>
            </div>

            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img 
                  src={qrCode} 
                  alt="QR Code para configuração do 2FA" 
                  className="w-48 h-48"
                />
              </div>
            )}

            {secret && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Ou digite a chave manualmente:
                </p>
                <code className="text-xs font-mono break-all">{secret}</code>
              </div>
            )}
          </div>

          {/* Step 2: Verification */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium">Digite o código</p>
                <p className="text-xs text-muted-foreground">
                  Insira o código de 6 dígitos exibido no seu app.
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={setVerificationCode}
                disabled={verifying}
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
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleCancel}
              disabled={verifying}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1" 
              onClick={verifyAndActivate}
              disabled={verifying || verificationCode.length !== 6}
            >
              {verifying ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Ativar 2FA
                </>
              )}
            </Button>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <Smartphone className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Apps compatíveis: Google Authenticator, Microsoft Authenticator, Authy, 1Password, entre outros.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
