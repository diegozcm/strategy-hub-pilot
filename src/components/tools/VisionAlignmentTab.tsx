import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVisionAlignment } from '@/hooks/useVisionAlignment';
import { VisionAlignmentForm } from './VisionAlignmentForm';
import { VisionAlignmentHistory } from './VisionAlignmentHistory';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { History, Edit, Trash2, Plus, Target, Handshake, FolderOpen, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const VisionAlignmentTab: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { loading, visionAlignment, loadVisionAlignment, deleteVisionAlignment } = useVisionAlignment();

  useEffect(() => {
    loadVisionAlignment();
  }, [loadVisionAlignment]);

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este Alinhamento de Visão?')) {
      await deleteVisionAlignment();
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadVisionAlignment();
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
          <h2 className="text-2xl font-bold text-foreground">Alinhamento de Visão</h2>
          <p className="text-muted-foreground">
            Definir objetivos, comprometimentos, recursos e riscos conjuntos
          </p>
        </div>
        <div className="flex gap-2">
          {visionAlignment && (
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
          {!visionAlignment && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Alinhamento de Visão
            </Button>
          )}
        </div>
      </div>

      {visionAlignment ? (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Objetivos Conjuntos */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-xl text-blue-700 dark:text-blue-400 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Objetivos Conjuntos
                </CardTitle>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  O que pretendemos atingir juntos?
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {visionAlignment.shared_objectives || 'Não definido'}
                </p>
              </CardContent>
            </Card>

            {/* Comprometimentos Conjuntos */}
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-xl text-yellow-700 dark:text-yellow-400 flex items-center">
                  <Handshake className="w-5 h-5 mr-2" />
                  Comprometimentos Conjuntos
                </CardTitle>
                <p className="text-sm text-yellow-600 dark:text-yellow-300">
                  Quem vai fazer o quê?
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {visionAlignment.shared_commitments || 'Não definido'}
                </p>
              </CardContent>
            </Card>

            {/* Recursos Conjuntos */}
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="text-xl text-orange-700 dark:text-orange-400 flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Recursos Conjuntos
                </CardTitle>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  De que recursos precisamos?
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {visionAlignment.shared_resources || 'Não definido'}
                </p>
              </CardContent>
            </Card>

            {/* Riscos Conjuntos */}
            <Card className="border-pink-200 bg-pink-50 dark:bg-pink-950/20 dark:border-pink-800">
              <CardHeader>
                <CardTitle className="text-xl text-pink-700 dark:text-pink-400 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Riscos Conjuntos
                </CardTitle>
                <p className="text-sm text-pink-600 dark:text-pink-300">
                  O que pode nos impedir de ter êxito?
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {visionAlignment.shared_risks || 'Não definido'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-sm text-muted-foreground">
            Última atualização: {formatDate(visionAlignment.updated_at)}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Nenhum Alinhamento de Visão criado
              </h3>
              <p className="text-muted-foreground mb-4">
                Crie seu Alinhamento de Visão para definir objetivos, comprometimentos, recursos e riscos conjuntos
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Alinhamento de Visão
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <VisionAlignmentForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleFormSuccess}
        visionAlignment={visionAlignment}
      />

      <VisionAlignmentHistory
        open={showHistory}
        onOpenChange={setShowHistory}
      />
    </>
  );
};