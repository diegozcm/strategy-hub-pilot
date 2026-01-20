import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface QuickTaskInputProps {
  onCreateTask: (title: string) => Promise<void>;
  disabled?: boolean;
}

export const QuickTaskInput: React.FC<QuickTaskInputProps> = ({ onCreateTask, disabled }) => {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await onCreateTask(title.trim());
      setTitle('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Plus className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Adicionar tarefa..."
          className="pl-8 h-9 text-sm"
          disabled={disabled || isCreating}
        />
      </div>
      <Button 
        type="submit" 
        size="sm" 
        variant="ghost"
        disabled={!title.trim() || isCreating}
        className="h-9 px-3"
      >
        {isCreating ? '...' : 'Enter ↵'}
      </Button>
    </form>
  );
};
