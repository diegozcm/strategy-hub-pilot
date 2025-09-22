import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import type { VisionAlignmentObjective } from '@/types/vision-alignment';

interface VisionObjectiveCardProps {
  objective: VisionAlignmentObjective;
  onEdit: (objective: VisionAlignmentObjective) => void;
  onDelete: (objectiveId: string) => void;
  isDragging?: boolean;
  onDragStart?: (objective: VisionAlignmentObjective) => void;
  onDragEnd?: () => void;
}

export const VisionObjectiveCard: React.FC<VisionObjectiveCardProps> = ({
  objective,
  onEdit,
  onDelete,
  isDragging = false,
  onDragStart,
  onDragEnd,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este objetivo?')) {
      onDelete(objective.id);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', objective.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(objective);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <Card 
      draggable
      className={`
        group relative transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50 rotate-2 shadow-lg' : 'hover:shadow-md hover:-translate-y-1'}
        border-l-4 min-h-[120px] shadow-sm hover:shadow-lg
        bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900
      `}
      style={{ 
        borderLeftColor: objective.color,
        backgroundColor: `${objective.color}08`,
        boxShadow: isHovered ? `0 8px 25px ${objective.color}20` : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardContent className="p-4 relative">
        {/* Drag Handle */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-50 transition-opacity">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Action Buttons - Always visible on mobile, hover on desktop */}
        <div className={`
          absolute top-2 right-2 flex gap-1 transition-opacity duration-200
          ${isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0'} 
          opacity-100 md:opacity-0 group-hover:opacity-100
        `}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-white/80 backdrop-blur-sm"
            onClick={() => onEdit(objective)}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground backdrop-blur-sm"
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="mt-6">
          <h4 
            className="font-semibold text-sm mb-2 pr-16 leading-tight"
            style={{ color: objective.color }}
          >
            {objective.title}
          </h4>
          {objective.description && (
            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
              {objective.description}
            </p>
          )}
        </div>

        {/* Post-it Corner Fold Effect */}
        <div 
          className="absolute top-0 right-0 w-4 h-4 transform rotate-45 translate-x-2 -translate-y-2 opacity-30 shadow-sm"
          style={{ backgroundColor: objective.color }}
        />
        
        {/* Subtle inner shadow for post-it effect */}
        <div 
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ 
            boxShadow: `inset 2px 2px 8px ${objective.color}10`,
          }}
        />
      </CardContent>
    </Card>
  );
};