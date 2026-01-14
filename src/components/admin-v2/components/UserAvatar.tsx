import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name?: string;
  email?: string;
  avatarUrl?: string;
  collapsed?: boolean;
}

export function UserAvatar({ name = "Admin", email, avatarUrl, collapsed = false }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (collapsed) {
    return (
      <div className="flex items-center justify-center p-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-t border-border p-4">
      <Avatar className="h-9 w-9">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col overflow-hidden">
        <span className="truncate text-sm font-medium text-foreground">{name}</span>
        {email && (
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        )}
      </div>
    </div>
  );
}
