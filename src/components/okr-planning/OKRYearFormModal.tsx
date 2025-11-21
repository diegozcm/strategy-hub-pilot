import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useOKRYears } from '@/hooks/useOKRYears';

const yearSchema = z.object({
  year: z.number().min(2020).max(2100),
  theme: z.string().optional(),
  description: z.string().optional(),
  autoCreateQuarters: z.boolean().default(true),
});

type YearFormData = z.infer<typeof yearSchema>;

interface OKRYearFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OKRYearFormModal: React.FC<OKRYearFormModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { createYear, loading } = useOKRYears();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<YearFormData>({
    resolver: zodResolver(yearSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      theme: '',
      description: '',
      autoCreateQuarters: true,
    },
  });

  const autoCreateQuarters = watch('autoCreateQuarters');

  const onSubmit = async (data: YearFormData) => {
    const result = await createYear(
      data.year,
      data.theme,
      data.description,
      data.autoCreateQuarters
    );
    
    if (result) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Ano OKR</DialogTitle>
          <DialogDescription>
            Configure um novo ano para planejamento de OKRs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="year">Ano</Label>
            <Input
              id="year"
              type="number"
              {...register('year', { valueAsNumber: true })}
            />
            {errors.year && (
              <p className="text-sm text-destructive">{errors.year.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Tema do Ano (Opcional)</Label>
            <Input
              id="theme"
              placeholder="ex: Ano da Transformação Digital"
              {...register('theme')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Input
              id="description"
              placeholder="Descreva os principais objetivos do ano"
              {...register('description')}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoCreateQuarters"
              checked={autoCreateQuarters}
              onCheckedChange={(checked) => 
                setValue('autoCreateQuarters', checked as boolean)
              }
            />
            <Label
              htmlFor="autoCreateQuarters"
              className="text-sm font-normal cursor-pointer"
            >
              Criar trimestres automaticamente (Q1-Q4)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Ano'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
