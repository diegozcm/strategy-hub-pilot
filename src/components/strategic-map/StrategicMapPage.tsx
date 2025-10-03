import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Building2, Target, Users, TrendingUp, Lightbulb, Heart, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useStrategicMap } from '@/hooks/useStrategicMap';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import { CompanySetupModal } from './CompanySetupModal';
import { PillarFormModal } from './PillarFormModal';
import { ObjectiveCard } from './ObjectiveCard';
import { ObjectiveFormModal } from './ObjectiveFormModal';
import { PillarEditModal } from './PillarEditModal';
import { DeletePillarModal } from './DeletePillarModal';
import { AddResultadoChaveModal } from './AddResultadoChaveModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PermissionGate } from '@/components/PermissionGate';
import { StrategicPillar, Company, KeyResult } from '@/types/strategic-map';
import { NoCompanyMessage } from '@/components/NoCompanyMessage';
import { supabase } from '@/integrations/supabase/client';

const defaultPillars = [
  { name: 'Econômico & Financeiro', color: '#22C55E', icon: TrendingUp },
  { name: 'Mercado e Imagem', color: '#3B82F6', icon: Users },
  { name: 'Tecnologia e Processos', color: '#F59E0B', icon: Target },
  { name: 'Inovação & Crescimento', color: '#8B5CF6', icon: Lightbulb },
  { name: 'Pessoas & Cultura', color: '#EF4444', icon: Heart },
];

export const StrategicMapPage = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
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
    calculatePillarProgress,
    refreshData,
    softRefresh
  } = useStrategicMap();

  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [showPillarForm, setShowPillarForm] = useState(false);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [selectedPillarId, setSelectedPillarId] = useState<string>('');
  const [editingPillar, setEditingPillar] = useState<StrategicPillar | null>(null);
  const [deletingPillar, setDeletingPillar] = useState<StrategicPillar | null>(null);
  
  // Handle KR modal from URL parameters
  const [showAddKRModal, setShowAddKRModal] = useState(false);
  const [targetObjectiveId, setTargetObjectiveId] = useState<string>('');

  // Check URL parameters on component mount and when search params change
  React.useEffect(() => {
    const openCreateKR = searchParams.get('openCreateKR');
    const objectiveId = searchParams.get('objectiveId');
    
    if (openCreateKR === '1' && objectiveId) {
      setTargetObjectiveId(objectiveId);
      setShowAddKRModal(true);
    }
  }, [searchParams]);

  // Clear URL parameters and close modal
  const handleCloseAddKRModal = () => {
    setShowAddKRModal(false);
    setTargetObjectiveId('');
    // Remove query parameters from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('openCreateKR');
    newSearchParams.delete('objectiveId');
    setSearchParams(newSearchParams);
  };

  // Handle KR creation with toast feedback
  const handleSaveKeyResult = async (keyResultData: Omit<KeyResult, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('key_results')
        .insert({
          ...keyResultData,
          objective_id: targetObjectiveId,
          owner_id: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Resultado-chave criado com sucesso!",
      });

      handleCloseAddKRModal();
      
      // Refresh the strategic map data
      refreshData();
    } catch (error) {
      console.error('Error creating key result:', error);
      toast({
        title: "Erro", 
        description: "Erro ao criar resultado-chave. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Show skeleton instead of full-page loader to avoid unmounting modals
  const isInitialLoading = loading && !company;

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
      {isInitialLoading ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-12 w-full bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-12 w-full bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-6 w-full bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompanySetup(true)}
            >
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Mission */}
            <div>
              <h3 className="font-semibold text-primary mb-2">Missão</h3>
              <p className="text-sm text-muted-foreground">
                {company.mission || 'Não definida'}
              </p>
            </div>

            {/* Vision */}
            <div>
              <h3 className="font-semibold text-primary mb-2">Visão</h3>
              <p className="text-sm text-muted-foreground">
                {company.vision || 'Não definida'}
              </p>
            </div>

            {/* Values */}
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
      )}

      <Separator />

      {/* Strategic Pillars */}
      <div className="space-y-4">
        {isInitialLoading ? (
          <>
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-muted animate-pulse" />
                  <CardHeader className="pb-3">
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                      <div className="h-2 w-full bg-muted animate-pulse rounded" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      <div className="space-y-2">
                        <div className="h-16 w-full bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
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
                                  <MoreVertical className="h-4 w-4" />
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
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                              <div 
                                className={`h-full transition-all duration-300 rounded-full ${
                                  progress < 30 ? 'bg-red-500' : 
                                  progress < 60 ? 'bg-yellow-500' : 
                                  progress < 80 ? 'bg-blue-500' : 
                                  'bg-green-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
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
                                    pillar={pillar}
                                    onAddResultadoChave={createKeyResult}
                                    onRefreshData={refreshData}
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
                                onClick={() => navigate('/app/objectives')}
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
          </>
        )}
      </div>

      {/* Modals - Always render to avoid unmounting */}
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
          onSave={async (data) => {
            console.log('💾 [StrategicMap] Creating new pillar...');
            const result = await createPillar(data);
            if (result) {
              console.log('✅ [StrategicMap] Pillar created, triggering soft refresh');
              void softRefresh();
            }
            return result;
          }}
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
          onSave={async (id, data) => {
            console.log('💾 [StrategicMap] Saving pillar edit...');
            const result = await updatePillar(id, data);
            if (result) {
              console.log('✅ [StrategicMap] Pillar updated, triggering soft refresh');
              void softRefresh();
            }
            return result;
          }}
        />
      )}

      {deletingPillar && (
        <DeletePillarModal
          pillar={deletingPillar}
          open={!!deletingPillar}
          onClose={() => setDeletingPillar(null)}
          onConfirm={async (id) => {
            console.log('🗑️ [StrategicMap] Deleting pillar...');
            const success = await deletePillar(id);
            if (success) {
              console.log('✅ [StrategicMap] Pillar deleted, triggering soft refresh');
              setDeletingPillar(null);
              void softRefresh();
            }
            return success;
          }}
          objectivesCount={objectives.filter(obj => obj.pillar_id === deletingPillar.id).length}
        />
      )}

      {/* Add KR Modal from URL parameters */}
      <AddResultadoChaveModal
        objectiveId={targetObjectiveId}
        open={showAddKRModal}
        onClose={handleCloseAddKRModal}
        onSave={handleSaveKeyResult}
      />
    </div>
  );
};