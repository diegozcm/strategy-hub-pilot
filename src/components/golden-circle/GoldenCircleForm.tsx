import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useGoldenCircle } from '@/hooks/useGoldenCircle';
import type { GoldenCircle } from '@/types/golden-circle';

const formSchema = z.object({
  why_question: z.string().optional(),
  how_question: z.string().optional(),
  what_question: z.string().optional(),
  change_reason: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface GoldenCircleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  goldenCircle?: GoldenCircle | null;
}

export const GoldenCircleForm: React.FC<GoldenCircleFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  goldenCircle,
}) => {
  const { loading, saveGoldenCircle } = useGoldenCircle();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      why_question: goldenCircle?.why_question || '',
      how_question: goldenCircle?.how_question || '',
      what_question: goldenCircle?.what_question || '',
      change_reason: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        why_question: goldenCircle?.why_question || '',
        how_question: goldenCircle?.how_question || '',
        what_question: goldenCircle?.what_question || '',
        change_reason: '',
      });
    }
  }, [open, goldenCircle, form]);

  const onSubmit = async (data: FormData) => {
    const success = await saveGoldenCircle(data);
    if (success) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {goldenCircle ? 'Editar Golden Circle' : 'Criar Golden Circle'}
          </DialogTitle>
          <DialogDescription>
            Defina as três perguntas fundamentais do Golden Circle de Simon Sinek
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="why_question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Por quê? (Propósito)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Por que sua empresa existe? Qual é o propósito, causa ou crença que inspira sua organização?"
                      className="resize-none"
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
              name="how_question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Como? (Processo)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Como você faz o que faz? Quais são seus valores, princípios e ações que tornam sua empresa única?"
                      className="resize-none"
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
              name="what_question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>O quê? (Produto)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="O que sua empresa faz? Quais produtos ou serviços você oferece como resultado do seu propósito?"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {goldenCircle && (
              <FormField
                control={form.control}
                name="change_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da alteração (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva brevemente o motivo desta alteração..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};