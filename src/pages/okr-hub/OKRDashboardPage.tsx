import { useState, useEffect } from 'react';
import { useOKRYears } from '@/hooks/useOKRYears';
import { useOKRPillars } from '@/hooks/useOKRPillars';
import { useOKRPermissions } from '@/hooks/useOKRPermissions';
import { OKRYearSelector } from '@/components/okr-planning';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Target, Layers, CheckSquare, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function OKRDashboardPage() {
  const { years, currentYear, setCurrentYear, loading: yearsLoading } = useOKRYears();
  const { pillars, loading: pillarsLoading, fetchPillars } = useOKRPillars();
  const { canCreateYear, canCreatePillar, isInModule } = useOKRPermissions();

  useEffect(() => {
    if (currentYear?.id) {
      fetchPillars(currentYear.id);
    }
  }, [currentYear?.id, fetchPillars]);

  if (!isInModule) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar o módulo OKR Planning.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header com Ano Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OKR HUB</h1>
          <p className="text-muted-foreground">
            Gestão completa de Objetivos e Resultados-Chave
          </p>
        </div>
        <div className="flex gap-3">
          <OKRYearSelector
            years={years}
            currentYear={currentYear}
            onYearChange={setCurrentYear}
            loading={yearsLoading}
          />
        </div>
      </div>

      {/* Dashboard Overview */}
      {currentYear && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pilares</p>
                <p className="text-2xl font-bold">{pillars.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Objetivos</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resultados-chave</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <CheckSquare className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ações</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pilares Section */}
      {currentYear && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Pilares do Ano {currentYear.year}</h2>
              <p className="text-sm text-muted-foreground">
                Estruturas que organizam seus objetivos estratégicos
              </p>
            </div>
            {canCreatePillar && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pilar
              </Button>
            )}
          </div>

          {pillarsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando pilares...
            </div>
          ) : pillars.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum pilar criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro pilar para começar a organizar seus OKRs
              </p>
              {canCreatePillar && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Pilar
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pillars.map((pillar) => (
                <Card key={pillar.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${pillar.color}20` }}
                      >
                        <Layers className="h-5 w-5" style={{ color: pillar.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{pillar.name}</h3>
                      </div>
                    </div>
                    <Badge variant="outline">0 objetivos</Badge>
                  </div>
                  
                  {pillar.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {pillar.description}
                    </p>
                  )}
                  
                  {pillar.sponsor && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Sponsor:</span>
                      <span className="font-medium">
                        {pillar.sponsor.first_name} {pillar.sponsor.last_name}
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Empty State - Nenhum ano criado */}
      {!currentYear && !yearsLoading && (
        <Card className="p-12 text-center">
          <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Bem-vindo ao OKR HUB</h2>
          <p className="text-muted-foreground mb-6">
            Comece criando um ano OKR para gerenciar seus objetivos e resultados-chave
          </p>
          {canCreateYear && (
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Criar Ano OKR
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
