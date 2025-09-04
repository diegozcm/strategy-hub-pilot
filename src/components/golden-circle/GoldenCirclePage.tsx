import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, History, Trash2, Plus } from 'lucide-react';
import { useGoldenCircle } from '@/hooks/useGoldenCircle';
import { useAuth } from '@/hooks/useMultiTenant';
import { NoCompanyMessage } from '@/components/NoCompanyMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GoldenCircleForm } from './GoldenCircleForm';
import { GoldenCircleHistory } from './GoldenCircleHistory';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const GoldenCirclePage: React.FC = () => {
  const { company: selectedCompany } = useAuth();
  const { loading, goldenCircle, loadGoldenCircle, deleteGoldenCircle } = useGoldenCircle();
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (selectedCompany) {
      loadGoldenCircle();
    }
  }, [selectedCompany, loadGoldenCircle]);

  if (!selectedCompany) {
    return <NoCompanyMessage />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  const handleDelete = async () => {
    await deleteGoldenCircle();
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadGoldenCircle();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Golden Circle</h1>
          <p className="text-muted-foreground">
            Defina o propósito, processo e produto da sua empresa baseado no conceito de Simon Sinek
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {goldenCircle && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
              >
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o Golden Circle? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {!goldenCircle && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Golden Circle
            </Button>
          )}
        </div>
      </div>

      {goldenCircle ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                Por quê?
              </CardTitle>
              <CardDescription>
                O propósito - por que sua empresa existe?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {goldenCircle.why_question || 'Não definido'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                Como?
              </CardTitle>
              <CardDescription>
                O processo - como você faz o que faz?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {goldenCircle.how_question || 'Não definido'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent"></div>
                O quê?
              </CardTitle>
              <CardDescription>
                O produto - o que sua empresa faz?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {goldenCircle.what_question || 'Não definido'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Golden Circle não definido</h3>
              <p className="text-muted-foreground mb-4">
                Crie o Golden Circle da sua empresa para definir o propósito, processo e produto.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Golden Circle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {goldenCircle && (
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Última atualização: {new Date(goldenCircle.updated_at).toLocaleDateString('pt-BR')}</span>
              <Badge variant="secondary">
                {selectedCompany.name}
              </Badge>
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
    </div>
  );
};