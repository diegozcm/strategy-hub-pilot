import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Shield, Clock, Lock, Info, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PasswordPolicy {
  id?: string;
  temp_password_validity_hours: number;
  require_password_change: boolean;
  min_password_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_number: boolean;
  require_special_char: boolean;
}

const VALIDITY_OPTIONS = [
  { value: '24', label: '1 dia (24 horas)' },
  { value: '168', label: '7 dias (recomendado)', recommended: true },
  { value: '720', label: '30 dias' },
  { value: '0', label: 'Sem expiração' },
];

const DEFAULT_POLICY: PasswordPolicy = {
  temp_password_validity_hours: 168,
  require_password_change: true,
  min_password_length: 8,
  require_uppercase: true,
  require_lowercase: true,
  require_number: true,
  require_special_char: true,
};

export default function PasswordPoliciesPage() {
  const [policy, setPolicy] = useState<PasswordPolicy>(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      const { data, error } = await supabase
        .from('password_policies')
        .select('*')
        .is('company_id', null)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPolicy({
          id: data.id,
          temp_password_validity_hours: data.temp_password_validity_hours,
          require_password_change: data.require_password_change,
          min_password_length: data.min_password_length,
          require_uppercase: data.require_uppercase,
          require_lowercase: data.require_lowercase,
          require_number: data.require_number,
          require_special_char: data.require_special_char,
        });
      }
    } catch (error) {
      console.error('Error loading password policy:', error);
      toast.error('Erro ao carregar políticas de senha');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (policy.min_password_length < 6) {
      toast.error('O tamanho mínimo da senha deve ser pelo menos 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      if (policy.id) {
        const { error } = await supabase
          .from('password_policies')
          .update({
            temp_password_validity_hours: policy.temp_password_validity_hours,
            require_password_change: policy.require_password_change,
            min_password_length: policy.min_password_length,
            require_uppercase: policy.require_uppercase,
            require_lowercase: policy.require_lowercase,
            require_number: policy.require_number,
            require_special_char: policy.require_special_char,
          })
          .eq('id', policy.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('password_policies')
          .insert({
            company_id: null,
            temp_password_validity_hours: policy.temp_password_validity_hours,
            require_password_change: policy.require_password_change,
            min_password_length: policy.min_password_length,
            require_uppercase: policy.require_uppercase,
            require_lowercase: policy.require_lowercase,
            require_number: policy.require_number,
            require_special_char: policy.require_special_char,
          });

        if (error) throw error;
      }

      toast.success('Políticas de senha salvas com sucesso!');
    } catch (error: any) {
      console.error('Error saving password policy:', error);
      toast.error('Erro ao salvar políticas de senha');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Políticas de Senha
        </h1>
        <p className="text-muted-foreground mt-1">
          Configurações › Segurança
        </p>
      </div>

      {/* Temporary Password Validity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Validade da Senha Temporária
          </CardTitle>
          <CardDescription>
            Define por quanto tempo a senha temporária permanece válida após a criação do usuário ou reset de senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={String(policy.temp_password_validity_hours)}
            onValueChange={(value) =>
              setPolicy((prev) => ({ ...prev, temp_password_validity_hours: Number(value) }))
            }
            className="space-y-3"
          >
            {VALIDITY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem value={option.value} id={`validity-${option.value}`} />
                <Label htmlFor={`validity-${option.value}`} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {policy.temp_password_validity_hours === 0 && (
            <Alert className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Atenção:</strong> Sem expiração, a senha temporária permanece válida indefinidamente até o usuário alterá-la. Isso pode representar um risco de segurança.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Password Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Requisitos de Senha
          </CardTitle>
          <CardDescription>
            Define os requisitos mínimos para novas senhas criadas pelos usuários.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <Label htmlFor="minLength" className="whitespace-nowrap">Tamanho mínimo:</Label>
            <Input
              id="minLength"
              type="number"
              min={6}
              max={32}
              value={policy.min_password_length}
              onChange={(e) =>
                setPolicy((prev) => ({ ...prev, min_password_length: Number(e.target.value) }))
              }
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">caracteres</span>
          </div>

          <Separator />

          <div className="space-y-3">
            {[
              { key: 'require_uppercase' as const, label: 'Exigir letra maiúscula (A-Z)' },
              { key: 'require_lowercase' as const, label: 'Exigir letra minúscula (a-z)' },
              { key: 'require_number' as const, label: 'Exigir número (0-9)' },
              { key: 'require_special_char' as const, label: 'Exigir caractere especial (!@#$%^&*)' },
            ].map((item) => (
              <div key={item.key} className="flex items-center space-x-3">
                <Checkbox
                  id={item.key}
                  checked={policy[item.key]}
                  onCheckedChange={(checked) =>
                    setPolicy((prev) => ({ ...prev, [item.key]: !!checked }))
                  }
                />
                <Label htmlFor={item.key} className="cursor-pointer">{item.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* First Login */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="requireChange"
              checked={policy.require_password_change}
              onCheckedChange={(checked) =>
                setPolicy((prev) => ({ ...prev, require_password_change: !!checked }))
              }
            />
            <Label htmlFor="requireChange" className="cursor-pointer font-medium">
              Forçar troca de senha no primeiro login
            </Label>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          As alterações se aplicam apenas a <strong>novas senhas temporárias</strong> geradas após salvar. Usuários já criados mantêm a validade original.
        </AlertDescription>
      </Alert>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          'Salvar Configurações'
        )}
      </Button>
    </div>
  );
}
