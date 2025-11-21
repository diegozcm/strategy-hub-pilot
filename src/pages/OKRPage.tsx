import { useState, useEffect } from 'react';
import { Target, Plus } from 'lucide-react';
import { useOKRYears } from '@/hooks/useOKRYears';
import { useOKRPeriods } from '@/hooks/useOKRPeriods';
import { useOKRPermissions } from '@/hooks/useOKRPermissions';
import { useOKRObjectives } from '@/hooks/useOKRObjectives';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OKRYearSelector } from '@/components/okr/OKRYearSelector';
import { OKRPeriodSelector } from '@/components/okr/OKRPeriodSelector';
import { OKRStatsCards } from '@/components/okr/OKRStatsCards';
import { OKRYear, OKRPeriod } from '@/types/okr';

/**
 * Página principal do módulo OKR Execution
 */
export const OKRPage = () => {
  const { years, loading: loadingYears, getActiveYear } = useOKRYears();
  const [selectedYear, setSelectedYear] = useState<OKRYear | null>(null);
  const { periods, loading: loadingPeriods, getActivePeriod } = useOKRPeriods(selectedYear?.id || null);
  const [selectedPeriod, setSelectedPeriod] = useState<OKRPeriod | null>(null);
  const { objectives, loading: loadingObjectives } = useOKRObjectives(selectedPeriod?.id || null);
  const { isAdminOrManager } = useOKRPermissions();

  // Auto-selecionar ano ativo ou mais recente
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      const activeYear = getActiveYear();
      setSelectedYear(activeYear || years[0]);
    }
  }, [years, selectedYear, getActiveYear]);

  // Auto-selecionar período ativo ou mais recente
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      const activePeriod = getActivePeriod();
      setSelectedPeriod(activePeriod || periods[0]);
    }
  }, [periods, selectedPeriod, getActivePeriod]);

  // Loading inicial
  if (loadingYears) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  // Se não houver anos criados
  if (!loadingYears && years.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8" />
              OKR Execution
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestão de OKRs (Objectives and Key Results) com planejamento anual e trimestral
            </p>
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Nenhum ano OKR cadastrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                {isAdminOrManager ? (
                  <>
                    Você ainda não criou nenhum ano de planejamento OKR. Clique no botão abaixo para
                    começar.
                  </>
                ) : (
                  <>Aguarde o administrador criar o planejamento OKR para sua empresa.</>
                )}
              </AlertDescription>
            </Alert>

            {isAdminOrManager && (
              <div className="mt-4">
                <Button onClick={() => alert('Modal de criação de ano será implementado em breve')}>
                  <Target className="mr-2 h-4 w-4" />
                  Criar Ano OKR
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            OKR Execution
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestão de OKRs com planejamento anual e trimestral
          </p>
        </div>

        {isAdminOrManager && (
          <Button onClick={() => alert('Modal de criação será implementado em breve')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo OKR
          </Button>
        )}
      </div>

      {/* Seletor de Ano */}
      <div className="mb-6">
        <OKRYearSelector
          years={years}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
        />
      </div>

      {/* Seletor de Trimestre */}
      {loadingPeriods ? (
        <div className="flex items-center justify-center min-h-[100px] mb-6">
          <LoadingSpinner />
        </div>
      ) : periods.length > 0 ? (
        <div className="mb-6">
          <OKRPeriodSelector
            periods={periods}
            selectedPeriod={selectedPeriod}
            onSelectPeriod={setSelectedPeriod}
          />
        </div>
      ) : (
        <Alert className="mb-6">
          <AlertDescription>
            Nenhum trimestre encontrado para este ano.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="mb-8">
        <OKRStatsCards period={selectedPeriod} loading={loadingPeriods} />
      </div>

      {/* Lista de Objetivos */}
      {loadingObjectives ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <LoadingSpinner />
        </div>
      ) : objectives.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum OKR cadastrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                {isAdminOrManager ? (
                  <>
                    Comece criando seu primeiro OKR para este trimestre. Clique no botão "Novo OKR" acima.
                  </>
                ) : (
                  <>Ainda não há OKRs cadastrados para este período.</>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">OKRs do Período</h2>
          {objectives.map((objective) => (
            <Card key={objective.id} className="relative overflow-hidden hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{objective.title}</CardTitle>
                    {objective.description && (
                      <p className="text-sm text-muted-foreground mt-1">{objective.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-primary">
                      {objective.progress_percentage.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {objective.completed_key_results}/{objective.total_key_results} KRs
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription className="text-xs">
                    Key Results e Iniciativas serão exibidos aqui nas próximas etapas da implementação.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};