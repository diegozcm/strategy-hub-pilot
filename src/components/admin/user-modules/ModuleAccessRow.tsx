
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  role: UserRole | null;
  onAccessChange: (checked: boolean) => void;
  onRoleChange: (role: UserRole | null) => void;
}

export const ModuleAccessRow: React.FC<ModuleAccessRowProps> = ({
  module,
  checked,
  role,
  onAccessChange,
  onRoleChange,
}) => {
  const isStrategyHub = module.slug === 'strategic-planning';
  const isStartupHub = module.slug === 'startup-hub';
  
  // Strategy HUB only has manager and member roles
  const roleList: UserRole[] = isStrategyHub ? ['manager', 'member'] : ['admin', 'manager', 'member'];
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

      {/* Renderizar roles usando RadioGroup */}
      <div className="pl-7 sm:pl-0">
        <RadioGroup 
          value={role || ''} 
          onValueChange={(value) => onRoleChange(value as UserRole)}
          disabled={isDisabled}
          className="flex gap-3"
        >
          {isStartupHub ? (
            // Startup HUB: apenas Startup ou Mentor
            <>
              <div className="flex items-center gap-2">
                <RadioGroupItem 
                  id={`role-${module.id}-startup`}
                  value="startup"
                  disabled={isDisabled}
                />
                <Label 
                  htmlFor={`role-${module.id}-startup`}
                  className={`cursor-pointer ${isDisabled ? 'text-muted-foreground opacity-60' : ''}`}
                >
                  Startup
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem 
                  id={`role-${module.id}-mentor`}
                  value="mentor"
                  disabled={isDisabled}
                />
                <Label 
                  htmlFor={`role-${module.id}-mentor`}
                  className={`cursor-pointer ${isDisabled ? 'text-muted-foreground opacity-60' : ''}`}
                >
                  Mentor
                </Label>
              </div>
            </>
          ) : (
            // Outros módulos: roles padrão (Strategy HUB sem admin)
            roleList.map((r) => {
              const roleId = `role-${module.id}-${r}`;
              return (
                <div key={r} className="flex items-center gap-2">
                  <RadioGroupItem 
                    id={roleId}
                    value={r}
                    disabled={isDisabled}
                  />
                  <Label 
                    htmlFor={roleId} 
                    className={`cursor-pointer ${isDisabled ? 'text-muted-foreground opacity-60' : ''}`}
                  >
                    {r === 'admin' ? 'Admin' : r === 'manager' ? 'Gestor' : 'Membro'}
                  </Label>
                </div>
              );
            })
          )}
        </RadioGroup>
      </div>
    </div>
  );
};

export default ModuleAccessRow;
