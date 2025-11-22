import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OKRObjectivesGrid } from "@/components/okr-planning/OKRObjectivesGrid";
import { OKRObjectiveModal } from "@/components/okr-planning/OKRObjectiveModal";
import { OKRYearSelector } from "@/components/okr-planning/OKRYearSelector";
import { useOKRYears } from "@/hooks/useOKRYears";
import { useOKRPillars } from "@/hooks/useOKRPillars";
import { useOKRObjectives } from "@/hooks/useOKRObjectives";
import { useOKRPermissions } from "@/hooks/useOKRPermissions";
import { useAuth } from "@/hooks/useMultiTenant";
import { OKRObjective } from "@/types/okr";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function OKRObjetivosPage() {
  const { company } = useAuth();
  const { years, currentYear, setCurrentYear, loading: yearsLoading } = useOKRYears();
  const { pillars, loading: pillarsLoading, fetchPillars } = useOKRPillars();
  const { objectives, loading: objectivesLoading, fetchObjectives } = useOKRObjectives();
  const { canCreateObjective } = useOKRPermissions();

  const [selectedPillarId, setSelectedPillarId] = useState<string>("all");
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<OKRObjective | null>(null);

  useEffect(() => {
    if (currentYear?.id && company?.id) {
      fetchPillars(currentYear.id);
    }
  }, [currentYear?.id, company?.id, fetchPillars]);

  useEffect(() => {
    if (currentYear?.id && company?.id) {
      fetchObjectives();
    }
  }, [currentYear?.id, company?.id, fetchObjectives]);

  const handleCreateObjective = () => {
    setSelectedObjective(null);
    setShowObjectiveModal(true);
  };

  const handleObjectiveClick = (objective: OKRObjective) => {
    setSelectedObjective(objective);
    setShowObjectiveModal(true);
  };

  const filteredObjectives = selectedPillarId === "all"
    ? objectives
    : objectives.filter(obj => obj.okr_pillar_id === selectedPillarId);

  if (!company) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">
          Selecione uma empresa para continuar
        </div>
      </div>
    );
  }

  const loading = yearsLoading || pillarsLoading || objectivesLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Objetivos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie objetivos organizados por pilares estratégicos
          </p>
        </div>
        {canCreateObjective && currentYear && pillars.length > 0 && (
          <Button onClick={handleCreateObjective}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Objetivo
          </Button>
        )}
      </div>

      {/* Year Selector */}
      <OKRYearSelector 
        years={years}
        currentYear={currentYear}
        onYearChange={setCurrentYear}
        loading={yearsLoading}
      />

      {/* Pillar Filter */}
      {pillars.length > 0 && (
        <div className="max-w-xs">
          <Label>Filtrar por Pilar</Label>
          <Select value={selectedPillarId} onValueChange={setSelectedPillarId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Pilares</SelectItem>
              {pillars.map((pillar) => (
                <SelectItem key={pillar.id} value={pillar.id}>
                  {pillar.icon} {pillar.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando objetivos...
        </div>
      ) : !currentYear ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhum ano OKR foi criado ainda
          </p>
        </div>
      ) : pillars.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Crie pilares primeiro para poder criar objetivos
          </p>
        </div>
      ) : filteredObjectives.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {selectedPillarId === "all" 
              ? "Nenhum objetivo criado ainda"
              : "Nenhum objetivo neste pilar"
            }
          </p>
          {canCreateObjective && (
            <Button onClick={handleCreateObjective}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Objetivo
            </Button>
          )}
        </div>
      ) : (
        <OKRObjectivesGrid
          objectives={filteredObjectives}
          onObjectiveClick={handleObjectiveClick}
          onCreateClick={handleCreateObjective}
        />
      )}

      {/* Objective Modal */}
      {showObjectiveModal && (
        <OKRObjectiveModal
          open={showObjectiveModal}
          onClose={() => {
            setShowObjectiveModal(false);
            setSelectedObjective(null);
          }}
          objective={selectedObjective}
        />
      )}
    </div>
  );
}
