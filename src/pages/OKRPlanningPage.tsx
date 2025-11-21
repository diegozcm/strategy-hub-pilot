import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOKRYears } from '@/hooks/useOKRYears';
import { useOKRQuarters } from '@/hooks/useOKRQuarters';
import { useOKRObjectives } from '@/hooks/useOKRObjectives';
import { useOKRPermissions } from '@/hooks/useOKRPermissions';
import {
  OKRYearSelector,
  OKRQuarterTabs,
  OKRObjectivesGrid,
  OKRObjectiveModal,
  OKRObjectiveForm,
  OKRYearFormModal,
} from '@/components/okr-planning';
import { OKRObjective } from '@/types/okr';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const OKRPlanningPage: React.FC = () => {
  const { years, currentYear, setCurrentYear, fetchYears, loading: yearsLoading } = useOKRYears();
  const { quarters, currentQuarter, setCurrentQuarter } = useOKRQuarters(currentYear?.id || null);
  const { objectives, createObjective, loading: objectivesLoading } = useOKRObjectives(currentQuarter?.id || null);
  const { isInModule, canCreateYear } = useOKRPermissions();
  
  const [selectedObjective, setSelectedObjective] = useState<OKRObjective | null>(null);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showYearForm, setShowYearForm] = useState(false);

  if (!isInModule) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-muted-foreground">
              Você não tem acesso ao módulo OKR Planning. Entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateObjective = async (data: any) => {
    if (!currentQuarter) return;
    
    const result = await createObjective({
      ...data,
      okr_quarter_id: currentQuarter.id,
      progress_percentage: 0,
    });
    
    if (result) {
      setShowCreateForm(false);
    }
  };

  const handleObjectiveClick = (objective: OKRObjective) => {
    setSelectedObjective(objective);
    setShowObjectiveModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">OKR Planning</h1>
          <p className="text-muted-foreground">
            Planejamento e Gestão de Objectives & Key Results
          </p>
        </div>
      </div>

      {years.length === 0 && !yearsLoading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum ano OKR configurado</h3>
            <p className="text-muted-foreground mb-4">
              Para começar, crie um ano OKR e defina seus trimestres
            </p>
            {canCreateYear && (
              <Button onClick={() => setShowYearForm(true)}>
                Criar Ano OKR
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <OKRYearSelector
                years={years}
                currentYear={currentYear}
                onYearChange={setCurrentYear}
                onYearCreated={fetchYears}
              />

              {currentYear && quarters.length > 0 && (
                <OKRQuarterTabs
                  quarters={quarters}
                  currentQuarter={currentQuarter}
                  onQuarterChange={setCurrentQuarter}
                />
              )}
            </CardContent>
          </Card>

          {currentQuarter && (
            <Card>
              <CardContent className="pt-6">
                <OKRObjectivesGrid
                  objectives={objectives}
                  onObjectiveClick={handleObjectiveClick}
                  onCreateClick={() => setShowCreateForm(true)}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Objetivo</DialogTitle>
          </DialogHeader>
          {currentQuarter && (
            <OKRObjectiveForm
              quarterId={currentQuarter.id}
              onSubmit={handleCreateObjective}
              onCancel={() => setShowCreateForm(false)}
              loading={objectivesLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <OKRObjectiveModal
        objective={selectedObjective}
        open={showObjectiveModal}
        onClose={() => {
          setShowObjectiveModal(false);
          setSelectedObjective(null);
        }}
      />

      <OKRYearFormModal
        open={showYearForm}
        onClose={() => setShowYearForm(false)}
        onSuccess={() => {
          setShowYearForm(false);
          fetchYears();
        }}
      />
    </div>
  );
};

export default OKRPlanningPage;
