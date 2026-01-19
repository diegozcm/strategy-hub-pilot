import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, UserX, UserCheck, Clock } from "lucide-react";
import { UserWithDetails } from "@/hooks/admin/useUsersStats";

interface UserHeaderProps {
  user: UserWithDetails;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  showAdmin?: boolean;
}

export function UserHeader({ user, size = 'md', showStatus = true, showAdmin = true }: UserHeaderProps) {
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '??';
  };

  const avatarSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizes = {
    sm: { name: 'text-sm', email: 'text-xs' },
    md: { name: 'text-base', email: 'text-sm' },
    lg: { name: 'text-lg', email: 'text-sm' }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className={avatarSizes[size]}>
        <AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {getInitials(user.first_name, user.last_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${textSizes[size].name}`}>
            {user.first_name} {user.last_name}
          </span>
          {showAdmin && user.is_system_admin && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
          {showStatus && (
            <Badge 
              variant={user.status === 'active' ? 'default' : 'secondary'}
              className={user.status === 'active' 
                ? 'bg-green-100 text-green-700 border-green-200 text-xs' 
                : 'bg-gray-100 text-gray-600 border-gray-200 text-xs'
              }
            >
              {user.status === 'active' ? (
                <><UserCheck className="h-3 w-3 mr-1" />Ativo</>
              ) : (
                <><UserX className="h-3 w-3 mr-1" />Inativo</>
              )}
            </Badge>
          )}
        </div>
        <p className={`text-muted-foreground ${textSizes[size].email} truncate`}>
          {user.email}
        </p>
        {user.company_name && (
          <p className={`text-muted-foreground ${textSizes[size].email} truncate`}>
            {user.company_name}
          </p>
        )}
      </div>
    </div>
  );
}