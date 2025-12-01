import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const objectiveSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  responsible: z.string().optional(),
  target_date: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'suspended']),
});

type ObjectiveFormData = z.infer<typeof objectiveSchema>;

interface ObjectiveFormModalProps {
  open: boolean;
  onClose: () => void;
  pillarId: string;
  planId: string;
  onSave: (data: any) => Promise<any>;
}

export const ObjectiveFormModal = ({ 
  open, 
  onClose, 
  pillarId, 
  planId,
  onSave 
}: ObjectiveFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ObjectiveFormData>({
    resolver: zodResolver(objectiveSchema),
    defaultValues: {
      title: '',
      description: '',
      responsible: '',
      target_date: '',
      status: 'not_started',
    },
  });

  const onSubmit = async (data: ObjectiveFormData) => {
    setIsSubmitting(true);
    
    try {
      const objectiveData = {
        ...data,
        pillar_id: pillarId,
        plan_id: planId,
        target_date: data.target_date ? new Date(data.target_date).toISOString().split('T')[0] : null,
      };

      console.log('Creating objective with data:', objectiveData);
      console.log('Plan ID being used:', planId);
      
      await onSave(objectiveData);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error saving objective:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Objetivo Estratégico</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título do objetivo" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o objetivo estratégico"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Meta</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="not_started">Não Iniciado</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Objetivo'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};