import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useMultiTenant";

interface UserAvatarProps {
  collapsed?: boolean;
}

export function UserAvatar({ collapsed = false }: UserAvatarProps) {
  const { profile, user } = useAuth();

  const name = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.first_name || "Admin";
  
  const email = user?.email || profile?.email;
  const avatarUrl = profile?.avatar_url;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-t border-border p-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-cofound-blue-dark text-cofound-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-t border-border p-4">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback className="bg-cofound-blue-dark text-cofound-white text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col overflow-hidden">
        <span className="truncate text-sm font-medium text-cofound-blue-dark">{name}</span>
        {email && (
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        )}
      </div>
    </div>
  );
}
