import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, ShieldCheck, ShieldOff, Plus, Trash2, Smartphone } from 'lucide-react';
import { MFAEnrollment } from './MFAEnrollment';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Factor {
  id: string;
  friendly_name: string;
  factor_type: string;
  status: string;
  created_at: string;
}

export const MFASettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [deletingFactorId, setDeletingFactorId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        console.error('Error loading factors:', error);
        toast.error('Erro ao carregar fatores de autenticação');
        setLoading(false);
        return;
      }

      // Get all TOTP factors (verified and unverified)
      const allFactors = data.totp.map(f => ({
        id: f.id,
        friendly_name: f.friendly_name || 'Authenticator App',
        factor_type: f.factor_type,
        status: f.status,
        created_at: f.created_at
      }));

      setFactors(allFactors);
    } catch (err) {
      console.error('Error loading factors:', err);
      toast.error('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFactor = async () => {
    if (!deletingFactorId) return;

    // Prevent removing the last MFA factor - mandatory for admins
    if (verifiedFactors.length <= 1) {
      toast.error('Administradores devem ter pelo menos um método de 2FA configurado');
      setDeletingFactorId(null);
      setConfirmDelete(false);
      return;
    }

    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: deletingFactorId
      });

      if (error) {
        console.error('Error deleting factor:', error);
        toast.error('Erro ao remover fator de autenticação');
        return;
      }

      toast.success('Fator de autenticação removido com sucesso');
      await loadFactors();
    } catch (err) {
      console.error('Error deleting factor:', err);
      toast.error('Erro inesperado');
    } finally {
      setDeletingFactorId(null);
      setConfirmDelete(false);
    }
  };

  const verifiedFactors = factors.filter(f => f.status === 'verified');

  const handleEnrollmentSuccess = () => {
    setShowEnrollment(false);
    loadFactors();
  };

  const hasMFA = verifiedFactors.length > 0;
  const canRemoveFactor = verifiedFactors.length > 1;

  if (showEnrollment) {
    return (
      <MFAEnrollment 
        onSuccess={handleEnrollmentSuccess}
        onCancel={() => setShowEnrollment(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${hasMFA ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
              {hasMFA ? (
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Shield className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Autenticação de Dois Fatores</CardTitle>
              <CardDescription>
                {hasMFA 
                  ? 'Sua conta está protegida com 2FA' 
                  : 'Adicione uma camada extra de segurança à sua conta'
                }
              </CardDescription>
            </div>
          </div>
          <Badge variant={hasMFA ? 'default' : 'secondary'}>
            {hasMFA ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <>
            {verifiedFactors.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Métodos configurados:</p>
                {verifiedFactors.map((factor) => (
                  <div 
                    key={factor.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{factor.friendly_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Configurado em {new Date(factor.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setDeletingFactorId(factor.id);
                        setConfirmDelete(true);
                      }}
                      disabled={!canRemoveFactor}
                      title={!canRemoveFactor ? 'Você deve ter pelo menos um método de 2FA' : undefined}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button 
              onClick={() => setShowEnrollment(true)}
              className="w-full"
              variant={hasMFA ? 'outline' : 'default'}
            >
              <Plus className="h-4 w-4 mr-2" />
              {hasMFA ? 'Adicionar outro método' : 'Configurar 2FA'}
            </Button>

            {!hasMFA && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                <ShieldOff className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-xs text-destructive">
                  A autenticação de dois fatores é obrigatória para todos os administradores do sistema.
                </p>
              </div>
            )}

            {hasMFA && !canRemoveFactor && (
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Você deve ter pelo menos um método de 2FA configurado. Adicione outro método antes de remover este.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover autenticação de dois fatores?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá este método de autenticação da sua conta. 
              Você precisará configurá-lo novamente se quiser usá-lo no futuro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingFactorId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFactor}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
