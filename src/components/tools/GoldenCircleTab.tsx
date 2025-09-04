import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoldenCircle } from '@/hooks/useGoldenCircle';
import { GoldenCircleForm } from '@/components/golden-circle/GoldenCircleForm';
import { GoldenCircleHistory } from '@/components/golden-circle/GoldenCircleHistory';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { History, Edit, Trash2, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const GoldenCircleTab: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { loading, goldenCircle, loadGoldenCircle, deleteGoldenCircle } = useGoldenCircle();

  useEffect(() => {
    loadGoldenCircle();
  }, [loadGoldenCircle]);

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este Golden Circle?')) {
      await deleteGoldenCircle();
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadGoldenCircle();
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
          <h2 className="text-2xl font-bold text-foreground">Golden Circle</h2>
          <p className="text-muted-foreground">
            Defina o propósito, processo e produto da sua empresa
          </p>
        </div>
        <div className="flex gap-2">
          {goldenCircle && (
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
          {!goldenCircle && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Golden Circle
            </Button>
          )}
        </div>
      </div>

      {goldenCircle ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Por que? (Why)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">
                {goldenCircle.why_question || 'Não definido'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Como? (How)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">
                {goldenCircle.how_question || 'Não definido'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">O que? (What)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">
                {goldenCircle.what_question || 'Não definido'}
              </p>
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground">
            Última atualização: {formatDate(goldenCircle.updated_at)}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Nenhum Golden Circle criado
              </h3>
              <p className="text-muted-foreground mb-4">
                Crie seu Golden Circle para definir o propósito da sua empresa
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Golden Circle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <GoldenCircleForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleFormSuccess}
        goldenCircle={goldenCircle}
      />

      <GoldenCircleHistory
        open={showHistory}
        onOpenChange={setShowHistory}
      />
    </>
  );
};