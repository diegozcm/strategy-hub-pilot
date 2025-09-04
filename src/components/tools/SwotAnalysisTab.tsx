import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSwotAnalysis } from '@/hooks/useSwotAnalysis';
import { SwotForm } from './SwotForm';
import { SwotHistory } from './SwotHistory';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { History, Edit, Trash2, Plus, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const SwotAnalysisTab: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { loading, swotAnalysis, loadSwotAnalysis, deleteSwotAnalysis } = useSwotAnalysis();

  useEffect(() => {
    loadSwotAnalysis();
  }, [loadSwotAnalysis]);

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta análise SWOT?')) {
      await deleteSwotAnalysis();
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadSwotAnalysis();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Análise SWOT</h2>
          <p className="text-muted-foreground">
            Identifique forças, fraquezas, oportunidades e ameaças
          </p>
        </div>
        <div className="flex gap-2">
          {swotAnalysis && (
            <>
              <Button variant="outline" onClick={() => setShowHistory(true)}>
                <History className="w-4 h-4 mr-2" />
                Histórico
              </Button>
              <Button variant="outline" onClick={() => setShowForm(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </>
          )}
          {!swotAnalysis && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Análise SWOT
            </Button>
          )}
        </div>
      </div>

      {swotAnalysis ? (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Forças */}
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-xl text-green-700 dark:text-green-400 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Forças (Strengths)
                </CardTitle>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Ambiente Interno - Pontos Positivos
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {swotAnalysis.strengths || 'Não definido'}
                </p>
              </CardContent>
            </Card>

            {/* Fraquezas */}
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-xl text-red-700 dark:text-red-400 flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2" />
                  Fraquezas (Weaknesses)
                </CardTitle>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Ambiente Interno - Pontos Negativos
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {swotAnalysis.weaknesses || 'Não definido'}
                </p>
              </CardContent>
            </Card>

            {/* Oportunidades */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-xl text-blue-700 dark:text-blue-400 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Oportunidades (Opportunities)
                </CardTitle>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Ambiente Externo - Pontos Positivos
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {swotAnalysis.opportunities || 'Não definido'}
                </p>
              </CardContent>
            </Card>

            {/* Ameaças */}
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="text-xl text-orange-700 dark:text-orange-400 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Ameaças (Threats)
                </CardTitle>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Ambiente Externo - Pontos Negativos
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {swotAnalysis.threats || 'Não definido'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-sm text-muted-foreground">
            Última atualização: {formatDate(swotAnalysis.updated_at)}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma análise SWOT criada
              </h3>
              <p className="text-muted-foreground mb-4">
                Crie sua análise SWOT para identificar aspectos estratégicos da sua empresa
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Análise SWOT
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <SwotForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleFormSuccess}
        swotAnalysis={swotAnalysis}
      />

      <SwotHistory
        open={showHistory}
        onOpenChange={setShowHistory}
      />
    </>
  );
};