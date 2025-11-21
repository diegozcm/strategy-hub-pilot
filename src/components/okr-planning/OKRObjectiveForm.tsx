import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OKRObjective } from '@/types/okr';

const objectiveSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string(),
});

type ObjectiveFormData = z.infer<typeof objectiveSchema>;

interface OKRObjectiveFormProps {
  objective?: OKRObjective;
  quarterId: string;
  onSubmit: (data: ObjectiveFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const OKRObjectiveForm: React.FC<OKRObjectiveFormProps> = ({
  objective,
  quarterId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ObjectiveFormData>({
    resolver: zodResolver(objectiveSchema),
    defaultValues: objective || {
      title: '',
      description: '',
      status: 'not_started',
      priority: 'medium',
    },
  });

  const status = watch('status');
  const priority = watch('priority');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título do Objetivo *</Label>
        <Input
          id="title"
          placeholder="Ex: Aumentar satisfação do cliente"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descreva o objetivo em detalhes..."
          rows={4}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Não Iniciado</SelectItem>
              <SelectItem value="on_track">No Caminho</SelectItem>
              <SelectItem value="at_risk">Em Risco</SelectItem>
              <SelectItem value="off_track">Fora do Caminho</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="delayed">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select
            value={priority}
            onValueChange={(value) => setValue('priority', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : objective ? 'Atualizar' : 'Criar Objetivo'}
        </Button>
      </div>
    </form>
  );
};
