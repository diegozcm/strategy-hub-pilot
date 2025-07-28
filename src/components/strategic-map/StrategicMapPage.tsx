import { useState } from 'react';
import { Plus, Building2, Target, Users, TrendingUp, Lightbulb, Heart, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useStrategicMap } from '@/hooks/useStrategicMap';
import { useAuth } from '@/hooks/useMultiTenant';
import { CompanySetupModal } from './CompanySetupModal';
import { PillarFormModal } from './PillarFormModal';
import { ObjectiveCard } from './ObjectiveCard';
import { ObjectiveFormModal } from './ObjectiveFormModal';
import { PillarEditModal } from './PillarEditModal';
import { DeletePillarModal } from './DeletePillarModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PermissionGate } from '@/components/PermissionGate';
import { StrategicPillar } from '@/types/strategic-map';
import { NoCompanyMessage } from '@/components/NoCompanyMessage';

const defaultPillars = [
  { name: 'Econômico & Financeiro', color: '#22C55E', icon: TrendingUp },
  { name: 'Mercado e Imagem', color: '#3B82F6', icon: Users },
  { name: 'Tecnologia e Processos', color: '#F59E0B', icon: Target },
  { name: 'Inovação & Crescimento', color: '#8B5CF6', icon: Lightbulb },
  { name: 'Pessoas & Cultura', color: '#EF4444', icon: Heart },
];

export const StrategicMapPage = () => {
  const { profile } = useAuth();
  const {
    loading,
    company,
    strategicPlan,
    pillars,
    objectives,
    keyResults,
    createCompany,
    updateCompany,
    createPillar,
    updatePillar,
    deletePillar,
    createObjective,
    createKeyResult,
    calculatePillarProgress
  } = useStrategicMap();

  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [showPillarForm, setShowPillarForm] = useState(false);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [selectedPillarId, setSelectedPillarId] = useState<string>('');
  const [editingPillar, setEditingPillar] = useState<StrategicPillar | null>(null);
  const [deletingPillar, setDeletingPillar] = useState<StrategicPillar | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  // Show company setup if no company exists
  if (!company) {
    return (
      <>
        <NoCompanyMessage onConfigureCompany={() => setShowCompanySetup(true)} />
        
        <CompanySetupModal
          open={showCompanySetup}
          onClose={() => setShowCompanySetup(false)}
          onSave={createCompany}
        />
      </>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Company Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {company.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt="Logo da empresa" 
                  className="h-8 w-8 object-contain rounded"
                />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
              <CardTitle className="text-2xl">
                {company.name}
              </CardTitle>
            </div>
            <PermissionGate 
              requiredRole="manager"
              fallback={null}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompanySetup(true)}
              >
                Editar
              </Button>
            </PermissionGate>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-primary mb-2">Missão</h3>
              <p className="text-sm text-muted-foreground">
                {company.mission || 'Não definida'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">Visão</h3>
              <p className="text-sm text-muted-foreground">
                {company.vision || 'Não definida'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">Valores</h3>
              <div className="flex flex-wrap gap-1">
                {company.values && company.values.length > 0 ? (
                  company.values.map((value, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {value}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Não definidos</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Strategic Pillars */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pilares Estratégicos</h2>
          <Button onClick={() => setShowPillarForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Pilar
          </Button>
        </div>

        {pillars.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum pilar estratégico</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando os pilares estratégicos da sua empresa para organizar seus objetivos.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sugestões de pilares:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {defaultPillars.map((pillar, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-secondary"
                        onClick={() => {
                          createPillar({ 
                            name: pillar.name, 
                            color: pillar.color,
                            description: `Pilar focado em ${pillar.name.toLowerCase()}`
                          });
                        }}
                      >
                        <pillar.icon className="mr-1 h-3 w-3" />
                        {pillar.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Pilares Existentes */}
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {pillars.map((pillar) => {
                const progress = calculatePillarProgress(pillar.id);
                const pillarObjectives = objectives.filter(obj => obj.pillar_id === pillar.id);

                return (
                  <Card key={pillar.id} className="relative overflow-hidden">
                    <div
                      className="absolute top-0 left-0 w-full h-1"
                      style={{ backgroundColor: pillar.color }}
                    />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{pillar.name}</CardTitle>
                          {pillar.description && (
                            <p className="text-sm text-muted-foreground">
                              {pillar.description}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingPillar(pillar)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeletingPillar(pillar)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progresso</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Objetivos</span>
                        <Badge variant="secondary">
                          {pillarObjectives.length}
                        </Badge>
                      </div>
                      
                      {pillarObjectives.length > 0 ? (
                        <div className="space-y-2">
                          {pillarObjectives.slice(0, 3).map((objective) => {
                            const objectiveKRs = keyResults.filter(kr => kr.objective_id === objective.id);
                            return (
                              <ObjectiveCard
                                key={objective.id}
                                objective={objective}
                                compact
                                keyResults={objectiveKRs}
                                onAddResultadoChave={createKeyResult}
                              />
                            );
                          })}
                          {pillarObjectives.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{pillarObjectives.length - 3} objetivos adicionais
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Target className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Nenhum objetivo definido
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => {
                              setSelectedPillarId(pillar.id);
                              setShowObjectiveForm(true);
                            }}
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            Adicionar Objetivo
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Sugestões de Pilares Restantes */}
            {(() => {
              const existingPillarNames = pillars.map(p => p.name);
              const remainingSuggestions = defaultPillars.filter(
                suggestion => !existingPillarNames.includes(suggestion.name)
              );
              
              if (remainingSuggestions.length > 0) {
                return (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <h3 className="text-sm font-medium mb-3">Adicionar mais pilares estratégicos:</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {remainingSuggestions.map((pillar, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="cursor-pointer hover:bg-secondary"
                              onClick={() => {
                                createPillar({ 
                                  name: pillar.name, 
                                  color: pillar.color,
                                  description: `Pilar focado em ${pillar.name.toLowerCase()}`
                                });
                              }}
                            >
                              <pillar.icon className="mr-1 h-3 w-3" />
                              {pillar.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>

      {/* Modals */}
        <CompanySetupModal
          open={showCompanySetup}
          onClose={() => setShowCompanySetup(false)}
          onSave={company 
            ? (dataOrId: any, data?: any) => updateCompany(dataOrId, data)
            : (data: any) => createCompany(data)
          }
          initialData={company}
          userRole={profile?.role || 'member'}
        />

      <PillarFormModal
        open={showPillarForm}
        onClose={() => setShowPillarForm(false)}
        onSave={createPillar}
      />

      <ObjectiveFormModal
        open={showObjectiveForm}
        onClose={() => setShowObjectiveForm(false)}
        pillarId={selectedPillarId}
        planId={strategicPlan?.id || ''}
        onSave={createObjective}
      />

      {editingPillar && (
        <PillarEditModal
          pillar={editingPillar}
          open={!!editingPillar}
          onClose={() => setEditingPillar(null)}
          onSave={updatePillar}
        />
      )}

      {deletingPillar && (
        <DeletePillarModal
          pillar={deletingPillar}
          open={!!deletingPillar}
          onClose={() => setDeletingPillar(null)}
          onConfirm={deletePillar}
          objectivesCount={objectives.filter(obj => obj.pillar_id === deletingPillar.id).length}
        />
      )}
    </div>
  );
};