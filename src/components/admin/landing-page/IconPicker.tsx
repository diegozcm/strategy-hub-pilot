import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import * as Icons from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const commonIcons = [
  'Target', 'TrendingUp', 'Rocket', 'Shield', 'Lock', 'Building2', 
  'Users', 'Star', 'Heart', 'CheckCircle', 'ArrowRight', 'Play',
  'Zap', 'Globe', 'Award', 'Lightbulb', 'BarChart3', 'Settings',
  'Phone', 'Mail', 'MapPin', 'Calendar', 'Clock', 'DollarSign'
];

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = commonIcons.filter(icon =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  const IconComponent = value && Icons[value as keyof typeof Icons] as React.ComponentType<any>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          {IconComponent && <IconComponent className="h-4 w-4" />}
          {value || 'Selecionar ícone'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar ícone..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Nenhum ícone encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredIcons.map((iconName) => {
                const Icon = Icons[iconName as keyof typeof Icons] as React.ComponentType<any>;
                return (
                  <CommandItem
                    key={iconName}
                    onSelect={() => {
                      onChange(iconName);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{iconName}</span>
                    {value === iconName && (
                      <Badge variant="secondary" className="ml-auto">
                        Selecionado
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};