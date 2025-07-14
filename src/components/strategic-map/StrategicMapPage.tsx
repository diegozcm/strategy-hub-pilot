import { useState } from 'react';
import { Plus, Building2, Target, Users, TrendingUp, Lightbulb, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useStrategicMap } from '@/hooks/useStrategicMap';
import { CompanySetupModal } from './CompanySetupModal';
import { PillarFormModal } from './PillarFormModal';
import { ObjectiveCard } from './ObjectiveCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const defaultPillars = [
  { name: 'Econômico & Financeiro', color: '#22C55E', icon: TrendingUp },
  { name: 'Mercado e Imagem', color: '#3B82F6', icon: Users },
  { name: 'Tecnologia e Processos', color: '#F59E0B', icon: Target },
  { name: 'Inovação & Crescimento', color: '#8B5CF6', icon: Lightbulb },
  { name: 'Pessoas & Cultura', color: '#EF4444', icon: Heart },
];

export const StrategicMapPage = () => {
  const {
    loading,
    company,
    pillars,
    objectives,
    keyResults,
    createCompany,
    createPillar,
    calculatePillarProgress
  } = useStrategicMap();

  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [showPillarForm, setShowPillarForm] = useState(false);

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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">Configure sua Empresa</h1>
          <p className="text-muted-foreground mb-8">
            Para começar a usar o Mapa Estratégico, primeiro configure as informações básicas da sua empresa.
          </p>
          <Button onClick={() => setShowCompanySetup(true)} size="lg">
            <Building2 className="mr-2 h-5 w-5" />
            Configurar Empresa
          </Button>
        </div>

        <CompanySetupModal
          open={showCompanySetup}
          onClose={() => setShowCompanySetup(false)}
          onSave={createCompany}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Company Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6" />
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
                    <CardTitle className="text-lg">{pillar.name}</CardTitle>
                    {pillar.description && (
                      <p className="text-sm text-muted-foreground">
                        {pillar.description}
                      </p>
                    )}
                    <div className="space-y-2">
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
                        {pillarObjectives.slice(0, 3).map((objective) => (
                          <ObjectiveCard
                            key={objective.id}
                            objective={objective}
                            compact
                          />
                        ))}
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
                        <Button variant="outline" size="sm" className="mt-2">
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
        )}
      </div>

      {/* Modals */}
      <CompanySetupModal
        open={showCompanySetup}
        onClose={() => setShowCompanySetup(false)}
        onSave={createCompany}
        initialData={company}
      />

      <PillarFormModal
        open={showPillarForm}
        onClose={() => setShowPillarForm(false)}
        onSave={createPillar}
      />
    </div>
  );
};