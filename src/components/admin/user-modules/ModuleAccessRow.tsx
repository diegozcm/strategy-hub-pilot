
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { UserRole } from '@/types/auth';

interface SystemModule {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface ModuleAccessRowProps {
  module: SystemModule;
  checked: boolean;
  roles: UserRole[];
  onAccessChange: (checked: boolean) => void;
  onRoleToggle: (role: UserRole) => void;
  startupOptions?: { startup: boolean; mentor: boolean };
  onStartupOptionToggle?: (option: 'startup' | 'mentor') => void;
}

export const ModuleAccessRow: React.FC<ModuleAccessRowProps> = ({
  module,
  checked,
  roles,
  onAccessChange,
  onRoleToggle,
  startupOptions,
  onStartupOptionToggle,
}) => {
  const roleList: UserRole[] = ['admin', 'manager', 'member'];
  const isDisabled = !checked;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          id={`module-${module.id}`}
          checked={!!checked}
          onCheckedChange={(v) => onAccessChange(!!v)}
        />
        <div className="flex-1">
          <label htmlFor={`module-${module.id}`} className="text-sm font-medium cursor-pointer">
            {module.name}
          </label>
          <p className="text-xs text-muted-foreground">{module.slug}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pl-7 sm:pl-0">
        {roleList.map((role) => {
          const roleId = `role-${module.id}-${role}`;
          const checkedRole = roles.includes(role);
          return (
            <div key={role} className="flex items-center gap-2">
              <Checkbox
                id={roleId}
                checked={checkedRole}
                onCheckedChange={() => onRoleToggle(role)}
                disabled={isDisabled}
              />
              <Label htmlFor={roleId} className={isDisabled ? 'text-muted-foreground' : ''}>
                {role === 'admin' ? 'Admin' : role === 'manager' ? 'Gestor' : 'Membro'}
              </Label>
            </div>
          );
        })}
      </div>

      {module.slug === 'startup-hub' && checked && startupOptions && onStartupOptionToggle && (
        <div className="grid grid-cols-2 gap-3 pl-7 sm:pl-0">
          {(['startup', 'mentor'] as const).map((opt) => {
            const optId = `sh-${module.id}-${opt}`;
            return (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  id={optId}
                  checked={startupOptions[opt]}
                  onCheckedChange={() => onStartupOptionToggle(opt)}
                />
                <Label htmlFor={optId}>
                  {opt === 'startup' ? 'Startup' : 'Mentor'}
                </Label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModuleAccessRow;
