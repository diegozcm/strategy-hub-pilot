import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { VisionObjectiveCard } from './VisionObjectiveCard';
import { VisionObjectiveForm } from './VisionObjectiveForm';
import { useVisionAlignmentObjectives } from '@/hooks/useVisionAlignmentObjectives';
import type { VisionAlignmentObjective } from '@/types/vision-alignment';

interface VisionDimensionSectionProps {
  dimension: 'objectives' | 'commitments' | 'resources' | 'risks';
  title: string;
  description: string;
  icon: React.ReactNode;
  visionAlignmentId: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}

export const VisionDimensionSection: React.FC<VisionDimensionSectionProps> = ({
  dimension,
  title,
  description,
  icon,
  visionAlignmentId,
  borderColor,
  bgColor,
  textColor,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingObjective, setEditingObjective] = useState<VisionAlignmentObjective | null>(null);
  
  const {
    loading,
    getObjectivesByDimension,
    createObjective,
    updateObjective,
    deleteObjective,
  } = useVisionAlignmentObjectives(visionAlignmentId);

  const objectives = getObjectivesByDimension(dimension);

  const handleAddObjective = () => {
    setEditingObjective(null);
    setShowForm(true);
  };

  const handleEditObjective = (objective: VisionAlignmentObjective) => {
    setEditingObjective(objective);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData: any) => {
    let success = false;
    
    if (editingObjective) {
      success = await updateObjective(editingObjective.id, formData);
    } else {
      success = await createObjective(dimension, formData);
    }

    if (success) {
      setShowForm(false);
      setEditingObjective(null);
    }
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    await deleteObjective(objectiveId);
  };

  return (
    <>
      <Card className={`${borderColor} ${bgColor} min-h-[400px]`}>
        <CardHeader className="pb-4">
          <CardTitle className={`text-xl ${textColor} flex items-center justify-between`}>
            <div className="flex items-center">
              {icon}
              {title}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddObjective}
              className={`${textColor} hover:bg-white/20`}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </CardTitle>
          <p className={`text-sm ${textColor.replace('text-', 'text-').replace('-700', '-600').replace('-400', '-300')}`}>
            {description}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {objectives.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-3">
                Nenhum objetivo adicionado ainda
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddObjective}
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeiro objetivo
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {objectives.map((objective) => (
                <VisionObjectiveCard
                  key={objective.id}
                  objective={objective}
                  onEdit={handleEditObjective}
                  onDelete={handleDeleteObjective}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <VisionObjectiveForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleFormSubmit}
        objective={editingObjective}
        dimension={dimension}
        loading={loading}
      />
    </>
  );
};