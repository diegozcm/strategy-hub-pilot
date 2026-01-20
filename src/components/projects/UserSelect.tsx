import React from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CompanyUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

interface UserSelectProps {
  users: CompanyUser[];
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const UserSelect: React.FC<UserSelectProps> = ({
  users,
  value,
  onValueChange,
  placeholder = 'Selecionar responsável',
  disabled,
  className
}) => {
  const selectedUser = users.find(u => u.user_id === value);

  return (
    <Select 
      value={value || 'none'} 
      onValueChange={(val) => onValueChange(val === 'none' ? null : val)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedUser.avatar_url} />
                <AvatarFallback className="text-[10px]">
                  {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedUser.first_name} {selectedUser.last_name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="text-muted-foreground">Sem responsável</span>
          </div>
        </SelectItem>
        {users.map((user) => (
          <SelectItem key={user.user_id} value={user.user_id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-[10px]">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <span>{user.first_name} {user.last_name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
