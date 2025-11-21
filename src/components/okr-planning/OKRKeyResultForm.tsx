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
import { OKRKeyResult } from '@/types/okr';

const keyResultSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  initial_value: z.number(),
  target_value: z.number(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  target_direction: z.enum(['maximize', 'minimize']),
  status: z.string(),
  due_date: z.string().optional(),
});

type KeyResultFormData = z.infer<typeof keyResultSchema>;

interface OKRKeyResultFormProps {
  keyResult?: OKRKeyResult;
  objectiveId: string;
  onSubmit: (data: KeyResultFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const OKRKeyResultForm: React.FC<OKRKeyResultFormProps> = ({
  keyResult,
  objectiveId,
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
  } = useForm<KeyResultFormData>({
    resolver: zodResolver(keyResultSchema),
    defaultValues: {
      title: keyResult?.title || '',
      description: keyResult?.description || '',
      initial_value: keyResult?.initial_value || 0,
      target_value: keyResult?.target_value || 100,
      unit: keyResult?.unit || '%',
      target_direction: (keyResult?.target_direction as 'maximize' | 'minimize') || 'maximize',
      status: keyResult?.status || 'not_started',
      due_date: keyResult?.due_date || '',
    },
  });

  const targetDirection = watch('target_direction');
  const status = watch('status');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título do Key Result *</Label>
        <Input
          id="title"
          placeholder="Ex: Atingir NPS de 80"
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
          placeholder="Descreva como este resultado será medido..."
          rows={3}
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="initial_value">Valor Inicial *</Label>
          <Input
            id="initial_value"
            type="number"
            step="0.01"
            {...register('initial_value', { valueAsNumber: true })}
          />
          {errors.initial_value && (
            <p className="text-sm text-destructive">{errors.initial_value.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_value">Valor Alvo *</Label>
          <Input
            id="target_value"
            type="number"
            step="0.01"
            {...register('target_value', { valueAsNumber: true })}
          />
          {errors.target_value && (
            <p className="text-sm text-destructive">{errors.target_value.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unidade *</Label>
          <Input
            id="unit"
            placeholder="%, R$, unidades"
            {...register('unit')}
          />
          {errors.unit && (
            <p className="text-sm text-destructive">{errors.unit.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_direction">Direção</Label>
        <Select
          value={targetDirection}
          onValueChange={(value) => setValue('target_direction', value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="maximize">📈 Maximizar</SelectItem>
            <SelectItem value="minimize">📉 Minimizar</SelectItem>
          </SelectContent>
        </Select>
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
          <Label htmlFor="due_date">Data de Vencimento</Label>
          <Input
            id="due_date"
            type="date"
            {...register('due_date')}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : keyResult ? 'Atualizar' : 'Criar Key Result'}
        </Button>
      </div>
    </form>
  );
};
