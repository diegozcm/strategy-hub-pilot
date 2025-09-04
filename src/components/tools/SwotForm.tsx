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
import { useSwotAnalysis } from '@/hooks/useSwotAnalysis';
import type { SwotAnalysis } from '@/types/swot';

const formSchema = z.object({
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  opportunities: z.string().optional(),
  threats: z.string().optional(),
  change_reason: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SwotFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  swotAnalysis?: SwotAnalysis | null;
}

export const SwotForm: React.FC<SwotFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  swotAnalysis,
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      strengths: '',
      weaknesses: '',
      opportunities: '',
      threats: '',
      change_reason: '',
    },
  });

  const { loading, saveSwotAnalysis } = useSwotAnalysis();

  useEffect(() => {
    if (open && swotAnalysis) {
      form.reset({
        strengths: swotAnalysis.strengths || '',
        weaknesses: swotAnalysis.weaknesses || '',
        opportunities: swotAnalysis.opportunities || '',
        threats: swotAnalysis.threats || '',
        change_reason: '',
      });
    } else if (open && !swotAnalysis) {
      form.reset({
        strengths: '',
        weaknesses: '',
        opportunities: '',
        threats: '',
        change_reason: '',
      });
    }
  }, [open, swotAnalysis, form]);

  const onSubmit = async (data: FormData) => {
    const success = await saveSwotAnalysis(data);
    if (success) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {swotAnalysis ? 'Editar Análise SWOT' : 'Criar Análise SWOT'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Forças */}
              <FormField
                control={form.control}
                name="strengths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700 dark:text-green-400 font-semibold">
                      Forças (Strengths)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva as forças da empresa (ambiente interno - pontos positivos)..."
                        {...field}
                        rows={8}
                        className="border-green-200 focus:border-green-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fraquezas */}
              <FormField
                control={form.control}
                name="weaknesses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-red-700 dark:text-red-400 font-semibold">
                      Fraquezas (Weaknesses)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva as fraquezas da empresa (ambiente interno - pontos negativos)..."
                        {...field}
                        rows={8}
                        className="border-red-200 focus:border-red-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Oportunidades */}
              <FormField
                control={form.control}
                name="opportunities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700 dark:text-blue-400 font-semibold">
                      Oportunidades (Opportunities)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva as oportunidades (ambiente externo - pontos positivos)..."
                        {...field}
                        rows={8}
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ameaças */}
              <FormField
                control={form.control}
                name="threats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-orange-700 dark:text-orange-400 font-semibold">
                      Ameaças (Threats)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva as ameaças (ambiente externo - pontos negativos)..."
                        {...field}
                        rows={8}
                        className="border-orange-200 focus:border-orange-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Razão da mudança (apenas ao editar) */}
            {swotAnalysis && (
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