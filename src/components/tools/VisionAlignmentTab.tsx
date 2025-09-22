import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVisionAlignment } from '@/hooks/useVisionAlignment';
import { useVisionAlignmentObjectives } from '@/hooks/useVisionAlignmentObjectives';
import { VisionAlignmentHistory } from './VisionAlignmentHistory';
import { VisionDimensionSection } from './VisionDimensionSection';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { History, Edit, Trash2, Target, Handshake, FolderOpen, AlertTriangle, Save, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const VisionAlignmentTab: React.FC = () => {
  const [showHistory, setShowHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { loading, visionAlignment, loadVisionAlignment, deleteVisionAlignment, ensureVisionAlignment } = useVisionAlignment();
  const { loadObjectives } = useVisionAlignmentObjectives(visionAlignment?.id);
  const { toast } = useToast();

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

  const handleEdit = async () => {
    // Ensure vision alignment exists before enabling edit mode
    const va = await ensureVisionAlignment();
    if (!va?.id) {
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a edição. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }
    await loadObjectives();
    setIsEditing((prev) => !prev);
  };

  const handleSave = () => {
    setIsEditing(false);
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
          <Button variant="outline" onClick={() => setShowHistory(true)}>
            <History className="w-4 h-4 mr-2" />
            Histórico
          </Button>
          {isEditing ? (
            <>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          {!isEditing && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Objetivos Conjuntos */}
          <VisionDimensionSection
            dimension="objectives"
            title="Objetivos Conjuntos"
            description="O que pretendemos atingir juntos?"
            icon={<Target className="w-5 h-5 mr-2" />}
            visionAlignmentId={visionAlignment?.id || ''}
            borderColor="border-blue-200"
            bgColor="bg-blue-50 dark:bg-blue-950/20"
            textColor="text-blue-700 dark:text-blue-400"
            isEditing={isEditing}
          />

          {/* Comprometimentos Conjuntos */}
          <VisionDimensionSection
            dimension="commitments"
            title="Comprometimentos Conjuntos"
            description="Quem vai fazer o quê?"
            icon={<Handshake className="w-5 h-5 mr-2" />}
            visionAlignmentId={visionAlignment?.id || ''}
            borderColor="border-yellow-200"
            bgColor="bg-yellow-50 dark:bg-yellow-950/20"
            textColor="text-yellow-700 dark:text-yellow-400"
            isEditing={isEditing}
          />

          {/* Recursos Conjuntos */}
          <VisionDimensionSection
            dimension="resources"
            title="Recursos Conjuntos"
            description="De que recursos precisamos?"
            icon={<FolderOpen className="w-5 h-5 mr-2" />}
            visionAlignmentId={visionAlignment?.id || ''}
            borderColor="border-orange-200"
            bgColor="bg-orange-50 dark:bg-orange-950/20"
            textColor="text-orange-700 dark:text-orange-400"
            isEditing={isEditing}
          />

          {/* Riscos Conjuntos */}
          <VisionDimensionSection
            dimension="risks"
            title="Riscos Conjuntos"
            description="O que pode nos impedir de ter êxito?"
            icon={<AlertTriangle className="w-5 h-5 mr-2" />}
            visionAlignmentId={visionAlignment?.id || ''}
            borderColor="border-pink-200"
            bgColor="bg-pink-50 dark:bg-pink-950/20"
            textColor="text-pink-700 dark:text-pink-400"
            isEditing={isEditing}
          />
        </div>

        {visionAlignment?.updated_at && (
          <div className="text-sm text-muted-foreground">
            Última atualização: {formatDate(visionAlignment.updated_at)}
          </div>
        )}
      </div>

      <VisionAlignmentHistory
        open={showHistory}
        onOpenChange={setShowHistory}
      />
    </>
  );
};