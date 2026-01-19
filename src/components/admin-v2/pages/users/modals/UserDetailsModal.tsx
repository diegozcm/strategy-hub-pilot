import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  Building2, 
  Shield, 
  Key,
  Mail,
  User,
  AlertTriangle
} from "lucide-react";
import { UserWithDetails } from "@/hooks/admin/useUsersStats";
import { UserHeader } from "./shared/UserHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithDetails | null;
}

interface TempPasswordData {
  temp_reset_token: string | null;
  temp_reset_expires: string | null;
}

export function UserDetailsModal({ open, onOpenChange, user }: UserDetailsModalProps) {
  const { toast } = useToast();
  const [tempPasswordData, setTempPasswordData] = useState<TempPasswordData | null>(null);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchTempPassword();
    } else {
      setTempPasswordData(null);
      setCopied(false);
    }
  }, [open, user]);

  const fetchTempPassword = async () => {
    if (!user) return;
    setLoadingPassword(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('temp_reset_token, temp_reset_expires')
        .eq('user_id', user.user_id)
        .single();

      if (error) throw error;
      setTempPasswordData(data);
    } catch (error) {
      console.error('Erro ao buscar senha temporária:', error);
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPasswordData?.temp_reset_token) {
      navigator.clipboard.writeText(tempPasswordData.temp_reset_token);
      setCopied(true);
      toast({ title: 'Copiado!', description: 'Senha temporária copiada para a área de transferência.' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca';
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const isPasswordValid = tempPasswordData?.temp_reset_token && 
    tempPasswordData?.temp_reset_expires && 
    new Date(tempPasswordData.temp_reset_expires) > new Date();

  const getPasswordExpirationInfo = () => {
    if (!tempPasswordData?.temp_reset_expires) return null;
    const expiresAt = new Date(tempPasswordData.temp_reset_expires);
    const now = new Date();
    if (expiresAt <= now) return { expired: true, text: 'Expirada' };
    const hoursLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    return { expired: false, text: `Expira em ${hoursLeft}h` };
  };

  if (!user) return null;

  const expirationInfo = getPasswordExpirationInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
          <DialogDescription>
            Informações completas do usuário no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <UserHeader user={user} size="lg" />

          <Separator />

          {/* Temporary Password Section */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Senha Temporária
            </h4>
            {loadingPassword ? (
              <Skeleton className="h-12 w-full" />
            ) : isPasswordValid ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border">
                  <code className="flex-1 font-mono text-sm bg-transparent">
                    {tempPasswordData.temp_reset_token}
                  </code>
                  <Button variant="ghost" size="sm" onClick={handleCopyPassword}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Clock className="h-3 w-3 mr-1" />
                    {expirationInfo?.text}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                {tempPasswordData?.temp_reset_token 
                  ? 'Senha temporária expirada. Gere uma nova.' 
                  : 'Nenhuma senha temporária ativa.'}
              </div>
            )}
          </div>

          <Separator />

          {/* User Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </p>
              <p className="font-medium truncate">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Empresa
              </p>
              <p className="font-medium">{user.company_name || 'Sem empresa'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Criado em
              </p>
              <p className="font-medium text-xs">
                {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Primeiro Login
              </p>
              <p className="font-medium text-xs">
                {user.first_login_at 
                  ? format(new Date(user.first_login_at), "dd/MM/yyyy", { locale: ptBR }) 
                  : <Badge variant="outline" className="text-xs">Nunca acessou</Badge>
                }
              </p>
            </div>
          </div>

          {/* Additional Status Info */}
          <div className="flex flex-wrap gap-2">
            {user.is_system_admin && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                <Shield className="h-3 w-3 mr-1" />
                Administrador do Sistema
              </Badge>
            )}
            {user.must_change_password && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                <Key className="h-3 w-3 mr-1" />
                Troca de senha pendente
              </Badge>
            )}
            {!user.first_login_at && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                <User className="h-3 w-3 mr-1" />
                Aguardando primeiro acesso
              </Badge>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}