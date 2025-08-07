import React from 'react';
import { Check, ChevronDown, Target, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useModules } from '@/hooks/useModules';

const iconMap = {
  Target,
  Rocket,
};

export const ModuleSelector: React.FC = () => {
  const { availableModules, currentModule, switchModule, loading } = useModules();

  if (loading || availableModules.length <= 1) {
    return null;
  }

  const getIcon = (iconName?: string) => {
    if (!iconName || !(iconName in iconMap)) return Target;
    return iconMap[iconName as keyof typeof iconMap];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center space-x-2">
            {currentModule && (
              <>
                {React.createElement(getIcon(currentModule.icon), { 
                  className: "h-4 w-4" 
                })}
                <span className="truncate">{currentModule.name}</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {availableModules.map((module) => {
          const Icon = getIcon(module.icon);
          const isActive = currentModule?.id === module.id;
          
          return (
            <DropdownMenuItem
              key={module.id}
              onClick={() => switchModule(module.id)}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                isActive && "bg-accent"
              )}
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{module.name}</div>
                  {module.description && (
                    <div className="text-xs text-muted-foreground">
                      {module.description}
                    </div>
                  )}
                </div>
              </div>
              {isActive && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};