import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Loader2 } from 'lucide-react';

interface TabControlsProps {
  isEditing: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export const TabControls: React.FC<TabControlsProps> = ({
  isEditing,
  hasChanges,
  isSaving,
  onStartEdit,
  onSave,
  onCancel,
}) => {
  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={onStartEdit} variant="outline" size="sm">
          <Edit3 className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {hasChanges && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Alterações não salvas
        </Badge>
      )}
      <Button 
        onClick={onSave} 
        disabled={isSaving || !hasChanges}
        size="sm"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Salvar
      </Button>
      <Button 
        onClick={onCancel} 
        variant="outline" 
        disabled={isSaving}
        size="sm"
      >
        <X className="h-4 w-4 mr-2" />
        Cancelar
      </Button>
    </div>
  );
};