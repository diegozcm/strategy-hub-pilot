import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Archive, Clock, FileText } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyOKRGate } from '@/components/okr/CompanyOKRGate';

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
    <CompanyOKRGate>
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
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  OKRs Ativos
                </TabsTrigger>
                <TabsTrigger value="backlog" className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Backlog
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Histórico
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Relatórios
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6 mt-6">
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Dashboard em desenvolvimento</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Visão geral de todos os anos e trimestres
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="active" className="space-y-6 mt-6">
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
              </TabsContent>

              <TabsContent value="backlog" className="space-y-6 mt-6">
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Archive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Backlog de Iniciativas</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Lista de iniciativas não alocadas (~200 itens para o ano)
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-6 mt-6">
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Histórico de OKRs</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Anos e trimestres anteriores (somente leitura)
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6 mt-6">
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Relatórios e Análises</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Gráficos, análises e exportação de dados
                  </p>
                </div>
              </TabsContent>
            </Tabs>
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
    </CompanyOKRGate>
  );
};

export default OKRPage;
