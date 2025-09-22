import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVisionAlignment } from '@/hooks/useVisionAlignment';
import { useVisionAlignmentObjectives } from '@/hooks/useVisionAlignmentObjectives';
import { VisionAlignmentForm } from './VisionAlignmentForm';
import { VisionAlignmentHistory } from './VisionAlignmentHistory';
import { VisionDimensionSection } from './VisionDimensionSection';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { History, Edit, Trash2, Plus, Target, Handshake, FolderOpen, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const VisionAlignmentTab: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { loading, visionAlignment, loadVisionAlignment, deleteVisionAlignment } = useVisionAlignment();
  const { loadObjectives } = useVisionAlignmentObjectives(visionAlignment?.id);

  useEffect(() => {
    loadVisionAlignment();
  }, [loadVisionAlignment]);

  useEffect(() => {
    if (visionAlignment?.id) {
      loadObjectives();
    }
  }, [visionAlignment?.id, loadObjectives]);

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
            <VisionDimensionSection
              dimension="objectives"
              title="Objetivos Conjuntos"
              description="O que pretendemos atingir juntos?"
              icon={<Target className="w-5 h-5 mr-2" />}
              visionAlignmentId={visionAlignment.id}
              borderColor="border-blue-200"
              bgColor="bg-blue-50 dark:bg-blue-950/20"
              textColor="text-blue-700 dark:text-blue-400"
            />

            {/* Comprometimentos Conjuntos */}
            <VisionDimensionSection
              dimension="commitments"
              title="Comprometimentos Conjuntos"
              description="Quem vai fazer o quê?"
              icon={<Handshake className="w-5 h-5 mr-2" />}
              visionAlignmentId={visionAlignment.id}
              borderColor="border-yellow-200"
              bgColor="bg-yellow-50 dark:bg-yellow-950/20"
              textColor="text-yellow-700 dark:text-yellow-400"
            />

            {/* Recursos Conjuntos */}
            <VisionDimensionSection
              dimension="resources"
              title="Recursos Conjuntos"
              description="De que recursos precisamos?"
              icon={<FolderOpen className="w-5 h-5 mr-2" />}
              visionAlignmentId={visionAlignment.id}
              borderColor="border-orange-200"
              bgColor="bg-orange-50 dark:bg-orange-950/20"
              textColor="text-orange-700 dark:text-orange-400"
            />

            {/* Riscos Conjuntos */}
            <VisionDimensionSection
              dimension="risks"
              title="Riscos Conjuntos"
              description="O que pode nos impedir de ter êxito?"
              icon={<AlertTriangle className="w-5 h-5 mr-2" />}
              visionAlignmentId={visionAlignment.id}
              borderColor="border-pink-200"
              bgColor="bg-pink-50 dark:bg-pink-950/20"
              textColor="text-pink-700 dark:text-pink-400"
            />
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