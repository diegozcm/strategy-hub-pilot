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
  const [draggedObjective, setDraggedObjective] = useState<VisionAlignmentObjective | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const {
    loading,
    getObjectivesByDimension,
    createObjective,
    updateObjective,
    deleteObjective,
    reorderObjectives,
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

  const handleDragStart = (objective: VisionAlignmentObjective) => {
    setDraggedObjective(objective);
  };

  const handleDragEnd = () => {
    setDraggedObjective(null);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isDragOver to false if we're leaving the container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedObjective || draggedId !== draggedObjective.id) return;

    // Get the drop target element
    const dropTarget = e.target as HTMLElement;
    const cardElement = dropTarget.closest('[data-objective-id]') as HTMLElement;
    
    if (!cardElement) return;
    
    const targetId = cardElement.getAttribute('data-objective-id');
    if (!targetId || targetId === draggedId) return;

    const objectivesInDimension = getObjectivesByDimension(dimension);
    const draggedIndex = objectivesInDimension.findIndex(obj => obj.id === draggedId);
    const targetIndex = objectivesInDimension.findIndex(obj => obj.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create reordered array
    const reorderedObjectives = [...objectivesInDimension];
    const [draggedItem] = reorderedObjectives.splice(draggedIndex, 1);
    reorderedObjectives.splice(targetIndex, 0, draggedItem);

    // Update order_index for each item
    const updatedObjectives = reorderedObjectives.map((obj, index) => ({
      ...obj,
      order_index: index
    }));

    await reorderObjectives(dimension, updatedObjectives);
  };

  return (
    <>
      <Card 
        className={`${borderColor} ${bgColor} min-h-[400px] transition-all duration-200 ${
          isDragOver ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50/50' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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
                <div
                  key={objective.id}
                  data-objective-id={objective.id}
                >
                  <VisionObjectiveCard
                    objective={objective}
                    onEdit={handleEditObjective}
                    onDelete={handleDeleteObjective}
                    isDragging={draggedObjective?.id === objective.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                </div>
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