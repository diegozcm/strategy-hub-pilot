import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useVisionAlignment } from '@/hooks/useVisionAlignment';
import type { VisionAlignment } from '@/types/vision-alignment';

const formSchema = z.object({
  shared_objectives: z.string().optional(),
  shared_commitments: z.string().optional(),
  shared_resources: z.string().optional(),
  shared_risks: z.string().optional(),
  change_reason: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface VisionAlignmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  visionAlignment?: VisionAlignment | null;
}

export const VisionAlignmentForm: React.FC<VisionAlignmentFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  visionAlignment,
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shared_objectives: '',
      shared_commitments: '',
      shared_resources: '',
      shared_risks: '',
      change_reason: '',
    },
  });

  const { loading, saveVisionAlignment } = useVisionAlignment();

  useEffect(() => {
    if (open && visionAlignment) {
      form.reset({
        shared_objectives: visionAlignment.shared_objectives || '',
        shared_commitments: visionAlignment.shared_commitments || '',
        shared_resources: visionAlignment.shared_resources || '',
        shared_risks: visionAlignment.shared_risks || '',
        change_reason: '',
      });
    } else if (open && !visionAlignment) {
      form.reset({
        shared_objectives: '',
        shared_commitments: '',
        shared_resources: '',
        shared_risks: '',
        change_reason: '',
      });
    }
  }, [open, visionAlignment, form]);

  const onSubmit = async (data: FormData) => {
    const success = await saveVisionAlignment(data);
    if (success) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {visionAlignment ? 'Editar Alinhamento de Visão' : 'Criar Alinhamento de Visão'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Objetivos Conjuntos */}
              <FormField
                control={form.control}
                name="shared_objectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700 dark:text-blue-400 font-semibold">
                      Objetivos Conjuntos
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="• O que pretendemos atingir juntos?&#10;• O que precisamos fazer?&#10;• O que precisamos entregar?&#10;• Que trabalho precisa ser feito?"
                        {...field}
                        rows={8}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comprometimentos Conjuntos */}
              <FormField
                control={form.control}
                name="shared_commitments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-yellow-700 dark:text-yellow-400 font-semibold">
                      Comprometimentos Conjuntos
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="• Quem vai fazer o quê?&#10;• Quem se compromete com o quê?&#10;• Como iremos nos envolver? Em conjunto?&#10;• Qual é o papel de cada um?"
                        {...field}
                        rows={8}
                        className="border-yellow-200 focus:border-yellow-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recursos Conjuntos */}
              <FormField
                control={form.control}
                name="shared_resources"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-orange-700 dark:text-orange-400 font-semibold">
                      Recursos Conjuntos
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="• De que recursos precisamos?&#10;• O que precisamos disponibilizar ou conseguir?&#10;• Como nos recursos que todos contribuem?&#10;• Quais são os meios necessários para realizar nosso trabalho?"
                        {...field}
                        rows={8}
                        className="border-orange-200 focus:border-orange-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Riscos Conjuntos */}
              <FormField
                control={form.control}
                name="shared_risks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-pink-700 dark:text-pink-400 font-semibold">
                      Riscos Conjuntos
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="• O que pode nos impedir de ter êxito?&#10;• O que pode sair errado?&#10;• Qual é o pior cenário imaginável?&#10;• Que problemas podem surgir?&#10;• Há receios/objeções em especial?"
                        {...field}
                        rows={8}
                        className="border-pink-200 focus:border-pink-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Razão da mudança (apenas ao editar) */}
            {visionAlignment && (
              <FormField
                control={form.control}
                name="change_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão da alteração (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o motivo desta alteração..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};