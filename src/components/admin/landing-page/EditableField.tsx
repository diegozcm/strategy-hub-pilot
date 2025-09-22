import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EditableFieldProps {
  id: string;
  label: string;
  value: string;
  isEditing: boolean;
  placeholder?: string;
  type?: 'input' | 'textarea';
  rows?: number;
  onChange: (value: string) => void;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  id,
  label,
  value,
  isEditing,
  placeholder,
  type = 'input',
  rows = 3,
  onChange,
}) => {
  if (!isEditing) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className={cn(
          "p-3 border rounded-md bg-muted/50",
          "text-sm text-muted-foreground",
          value ? "text-foreground" : "italic"
        )}>
          {value || `(${label} não definido)`}
        </div>
      </div>
    );
  }

  const commonProps = {
    id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      onChange(e.target.value),
    placeholder,
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {type === 'textarea' ? (
        <Textarea {...commonProps} rows={rows} />
      ) : (
        <Input {...commonProps} />
      )}
    </div>
  );
};