import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { VisionAlignmentObjective, VisionAlignmentObjectiveFormData } from '@/types/vision-alignment';

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um hex válido'),
});

type FormData = z.infer<typeof formSchema>;

interface VisionObjectiveFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: VisionAlignmentObjectiveFormData) => void;
  objective?: VisionAlignmentObjective | null;
  dimension: 'objectives' | 'commitments' | 'resources' | 'risks';
  loading?: boolean;
}

const dimensionColors = {
  objectives: '#3B82F6',
  commitments: '#F59E0B', 
  resources: '#F97316',
  risks: '#EC4899',
};

const dimensionLabels = {
  objectives: 'Objetivos Conjuntos',
  commitments: 'Comprometimentos Conjuntos',
  resources: 'Recursos Conjuntos',
  risks: 'Riscos Conjuntos',
};

export const VisionObjectiveForm: React.FC<VisionObjectiveFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  objective,
  dimension,
  loading = false,
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      color: dimensionColors[dimension],
    },
  });

  useEffect(() => {
    if (open) {
      if (objective) {
        form.reset({
          title: objective.title,
          description: objective.description || '',
          color: objective.color,
        });
      } else {
        form.reset({
          title: '',
          description: '',
          color: dimensionColors[dimension],
        });
      }
    }
  }, [open, objective, dimension, form]);

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      title: data.title,
      description: data.description,
      color: data.color,
    });
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {objective ? 'Editar Objetivo' : 'Adicionar Objetivo'}
          </DialogTitle>
          <DialogDescription>
            {dimensionLabels[dimension]}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o título do objetivo..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite uma descrição detalhada..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor do Post-it</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1 rounded cursor-pointer"
                        {...field}
                      />
                      <Input
                        placeholder="#3B82F6"
                        {...field}
                        className="font-mono text-sm"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : objective ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};