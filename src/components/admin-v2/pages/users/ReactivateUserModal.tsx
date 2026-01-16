import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserWithDetails } from "@/hooks/admin/useUsersStats";
import { UserCheck, CheckCircle2 } from "lucide-react";

interface ReactivateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithDetails | null;
  onConfirm: () => void;
}

export function ReactivateUserModal({ open, onOpenChange, user, onConfirm }: ReactivateUserModalProps) {
  if (!user) return null;

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <UserCheck className="h-5 w-5" />
            Reativar Usuário
          </DialogTitle>
          <DialogDescription>
            Esta ação irá restaurar o acesso do usuário ao sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">{user.company_name}</p>
            </div>
          </div>

          {/* Info */}
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm">
              <strong>Ao reativar este usuário:</strong>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>O usuário recuperará acesso ao sistema</li>
                <li>Todas as permissões anteriores serão restauradas</li>
                <li>O usuário poderá fazer login normalmente</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirm}>
            Reativar Usuário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
