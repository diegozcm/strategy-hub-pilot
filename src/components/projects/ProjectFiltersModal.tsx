import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface CompanyUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

interface Pillar {
  name: string;
  color: string;
}

interface Objective {
  id: string;
  title: string;
  strategic_pillars?: {
    name: string;
    color: string;
  };
}

export interface ProjectFilters {
  pillar: string;
  objective: string;
  responsible: string;
  status: string;
}

interface ProjectFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  pillars: Pillar[];
  objectives: Objective[];
  users: CompanyUser[];
}

export const ProjectFiltersModal: React.FC<ProjectFiltersModalProps> = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  pillars,
  objectives,
  users
}) => {
  const handleClearFilters = () => {
    onFiltersChange({
      pillar: 'all',
      objective: 'all',
      responsible: 'all',
      status: 'all'
    });
  };

  const activeFiltersCount = [
    filters.pillar !== 'all',
    filters.objective !== 'all',
    filters.responsible !== 'all',
    filters.status !== 'all'
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar ({activeFiltersCount})
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Pillar Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pilar Estratégico</Label>
            <Select 
              value={filters.pillar} 
              onValueChange={(value) => onFiltersChange({ ...filters, pillar: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os pilares" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pilares</SelectItem>
                {pillars.map((pillar) => (
                  <SelectItem key={pillar.name} value={pillar.name}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: pillar.color }}
                      />
                      <span>{pillar.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Objective Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Objetivo Estratégico</Label>
            <Select 
              value={filters.objective} 
              onValueChange={(value) => onFiltersChange({ ...filters, objective: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os objetivos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os objetivos</SelectItem>
                {objectives.map((objective) => (
                  <SelectItem key={objective.id} value={objective.id}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: objective.strategic_pillars?.color || '#94a3b8' }}
                      />
                      <span className="truncate max-w-[280px]">{objective.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsible Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Responsável</Label>
            <Select 
              value={filters.responsible} 
              onValueChange={(value) => onFiltersChange({ ...filters, responsible: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os responsáveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.first_name} {user.last_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="planning">Planejamento</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="on_hold">Em Pausa</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Aplicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
