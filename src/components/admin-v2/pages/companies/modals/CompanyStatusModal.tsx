import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CompanyHeader } from "./shared/CompanyHeader";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CompanyWithDetails {
  id: string;
  name: string;
  logo_url?: string | null;
  status?: string | null;
  company_type?: string | null;
  ai_enabled?: boolean;
  userCount?: number;
}

interface CompanyStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyWithDetails | null;
  action: 'deactivate' | 'reactivate';
  onSuccess: () => void;
}

export function CompanyStatusModal({ 
  open, 
  onOpenChange, 
  company, 
  action, 
  onSuccess 
}: CompanyStatusModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!company) return null;

  const isDeactivating = action === 'deactivate';
  const newStatus = isDeactivating ? 'inactive' : 'active';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: isDeactivating ? "Empresa desativada" : "Empresa reativada",
        description: isDeactivating 
          ? "A empresa foi desativada com sucesso."
          : "A empresa foi reativada com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating company status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da empresa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDeactivating ? (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Desativar Empresa
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Reativar Empresa
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeactivating 
              ? "Tem certeza que deseja desativar esta empresa?"
              : "Tem certeza que deseja reativar esta empresa?"
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <CompanyHeader company={company} />
        </div>

        <Alert variant={isDeactivating ? "destructive" : "default"}>
          <AlertDescription>
            {isDeactivating ? (
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>Todos os {company.userCount || 0} usuário(s) perderão acesso</li>
                <li>Os dados da empresa serão preservados</li>
                <li>A empresa pode ser reativada a qualquer momento</li>
              </ul>
            ) : (
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>Os usuários ativos recuperarão o acesso</li>
                <li>Todos os dados serão restaurados</li>
                <li>As configurações anteriores serão mantidas</li>
              </ul>
            )}
          </AlertDescription>
        </Alert>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={isDeactivating ? "bg-orange-600 hover:bg-orange-700" : "bg-cofound-green hover:bg-cofound-green/90 text-cofound-blue-dark"}
          >
            {loading ? "Processando..." : isDeactivating ? "Desativar" : "Reativar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
