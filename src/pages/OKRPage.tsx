import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useOKRYears } from '@/hooks/useOKRYears';
import { useOKRPeriods } from '@/hooks/useOKRPeriods';
import { useOKRObjectives } from '@/hooks/useOKRObjectives';
import { useOKRPermissions } from '@/hooks/useOKRPermissions';
import { OKRYearSelector } from '@/components/okr/OKRYearSelector';
import { OKRPeriodSelector } from '@/components/okr/OKRPeriodSelector';
import { OKRStatsCards } from '@/components/okr/OKRStatsCards';
import { CreateYearModal } from '@/components/okr/CreateYearModal';
import { CreateObjectiveModal } from '@/components/okr/CreateObjectiveModal';
import { ObjectiveCard } from '@/components/okr/ObjectiveCard';
import { OKRYear, OKRPeriod } from '@/types/okr';

const OKRPage = () => {
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [showCreateYear, setShowCreateYear] = useState(false);
  const [showCreateObjective, setShowCreateObjective] = useState(false);

  const { years, loading: yearsLoading, createYear } = useOKRYears();
  const { periods, loading: periodsLoading } = useOKRPeriods(selectedYearId);
  const { objectives, loading: objectivesLoading, createObjective } = useOKRObjectives(selectedPeriodId);
  const { canCreateOKR } = useOKRPermissions();

  const selectedYear = years.find((y) => y.id === selectedYearId) || null;
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId) || null;
  const loading = yearsLoading || periodsLoading || objectivesLoading;

  const handleCreateYear = async (year: number, startDate: string, endDate: string) => {
    await createYear({ year, start_date: startDate, end_date: endDate });
  };

  const handleSelectYear = (year: OKRYear) => {
    setSelectedYearId(year.id);
    setSelectedPeriodId(null);
  };

  const handleSelectPeriod = (period: OKRPeriod) => {
    setSelectedPeriodId(period.id);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OKR Execution</h1>
          <p className="text-muted-foreground">
            Gerencie objetivos, key results e iniciativas por trimestre
          </p>
        </div>
      </div>

      {yearsLoading ? (
        <div className="text-center py-8">Carregando anos...</div>
      ) : years.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">Nenhum ano OKR cadastrado</p>
          {canCreateOKR && (
            <Button onClick={() => setShowCreateYear(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Ano
            </Button>
          )}
        </div>
      ) : (
        <>
          <OKRYearSelector
            years={years}
            selectedYear={selectedYear}
            onSelectYear={handleSelectYear}
          />

          {selectedYearId && (
            <>
              <OKRPeriodSelector
                periods={periods}
                selectedPeriod={selectedPeriod}
                onSelectPeriod={handleSelectPeriod}
              />

              {selectedPeriodId && selectedPeriod && (
                <OKRStatsCards period={selectedPeriod} />
              )}

              {selectedPeriodId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Objetivos</h2>
                    {canCreateOKR && (
                      <Button onClick={() => setShowCreateObjective(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Objetivo
                      </Button>
                    )}
                  </div>

                  {loading ? (
                    <div className="text-center py-8">Carregando objetivos...</div>
                  ) : objectives.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">Nenhum objetivo cadastrado neste trimestre</p>
                      {canCreateOKR && (
                        <Button className="mt-4" onClick={() => setShowCreateObjective(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeiro Objetivo
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {objectives.map((objective) => (
                        <ObjectiveCard key={objective.id} objective={objective} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      <CreateYearModal
        open={showCreateYear}
        onOpenChange={setShowCreateYear}
        onYearCreated={handleCreateYear}
      />

      {selectedPeriodId && (
        <CreateObjectiveModal
          open={showCreateObjective}
          onOpenChange={setShowCreateObjective}
          periodId={selectedPeriodId}
          onObjectiveCreated={async (data) => {
            await createObjective(data);
          }}
        />
      )}
    </div>
  );
};

export default OKRPage;
