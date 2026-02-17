import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Pillar {
  id: string;
  name: string;
  color: string;
}

interface Objective {
  id: string;
  title: string;
  pillar_id: string;
}

interface KRFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillarFilter: string;
  setPillarFilter: (value: string) => void;
  objectiveFilter: string;
  setObjectiveFilter: (value: string) => void;
  progressFilter: string;
  setProgressFilter: (value: string) => void;
  pillars: Pillar[];
  objectives: Objective[];
  activeFilterCount: number;
}

const statusOptions = [
  { value: 'all', label: 'Todos os status', color: null },
  { value: 'excellent', label: 'Excelente', description: '>105%', color: 'hsl(221, 83%, 53%)' },
  { value: 'success', label: 'No Alvo', description: '100-105%', color: 'hsl(142, 71%, 45%)' },
  { value: 'attention', label: 'Atenção', description: '71-99%', color: 'hsl(45, 93%, 47%)' },
  { value: 'critical', label: 'Críticos', description: '<71%', color: 'hsl(0, 84%, 60%)' },
];

export const KRFiltersSheet: React.FC<KRFiltersSheetProps> = ({
  open,
  onOpenChange,
  pillarFilter,
  setPillarFilter,
  objectiveFilter,
  setObjectiveFilter,
  progressFilter,
  setProgressFilter,
  pillars,
  objectives,
  activeFilterCount,
}) => {
  const filteredObjectives = objectives.filter(
    obj => pillarFilter === 'all' || obj.pillar_id === pillarFilter
  );

  const handleClearFilters = () => {
    setPillarFilter('all');
    setObjectiveFilter('all');
    setProgressFilter('all');
  };

  const handlePillarChange = (value: string) => {
    setPillarFilter(value);
    setObjectiveFilter('all');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Filtros</SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* PILAR ESTRATÉGICO */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pilar Estratégico
            </h3>
            <RadioGroup value={pillarFilter} onValueChange={handlePillarChange} className="gap-1.5">
              <label
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all",
                  pillarFilter === 'all'
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:bg-accent/50"
                )}
              >
                <RadioGroupItem value="all" id="pillar-all" />
                <span className="text-sm font-medium">Todos os pilares</span>
              </label>
              {pillars.map(pillar => (
                <label
                  key={pillar.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all",
                    pillarFilter === pillar.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:bg-accent/50"
                  )}
                >
                  <RadioGroupItem value={pillar.id} id={`pillar-${pillar.id}`} />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pillar.color }}
                  />
                  <span className="text-sm font-medium">{pillar.name}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* OBJETIVO */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Objetivo
            </h3>
            <RadioGroup value={objectiveFilter} onValueChange={setObjectiveFilter} className="gap-1.5">
              <label
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all",
                  objectiveFilter === 'all'
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:bg-accent/50"
                )}
              >
                <RadioGroupItem value="all" id="obj-all" />
                <span className="text-sm font-medium">Todos os objetivos</span>
              </label>
              {filteredObjectives.map(obj => (
                <label
                  key={obj.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all",
                    objectiveFilter === obj.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:bg-accent/50"
                  )}
                >
                  <RadioGroupItem value={obj.id} id={`obj-${obj.id}`} />
                  <span className="text-sm font-medium truncate">{obj.title}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* STATUS DE DESEMPENHO */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status de Desempenho
            </h3>
            <RadioGroup value={progressFilter} onValueChange={setProgressFilter} className="gap-1.5">
              {statusOptions.map(option => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all",
                    progressFilter === option.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:bg-accent/50"
                  )}
                >
                  <RadioGroupItem value={option.value} id={`status-${option.value}`} />
                  {option.color && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className="text-sm font-medium">{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {option.description}
                    </span>
                  )}
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Footer */}
        {activeFilterCount > 0 && (
          <div className="border-t border-border pt-4 pb-2">
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4" />
              Limpar todos os filtros ({activeFilterCount})
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
