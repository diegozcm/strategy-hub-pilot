import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const PublishButton = () => {
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    try {
      setPublishing(true);
      
      // Call the publish function
      const { error } = await supabase.rpc('publish_landing_page_content');
      
      if (error) throw error;

      toast.success('Landing Page Publicada!', {
        description: 'O conteúdo foi publicado e está visível para todos os usuários.',
      });

      // Optional: Reload the preview to sync
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Erro ao publicar', {
        description: error instanceof Error ? error.message : 'Não foi possível publicar o conteúdo. Tente novamente.',
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          size="lg" 
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl"
          disabled={publishing}
        >
          <Upload className="mr-2 h-5 w-5" />
          {publishing ? 'Publicando...' : 'Publicar Landing Page'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Confirmar Publicação
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-left">
            <p>
              Você está prestes a publicar todas as alterações da Landing Page Preview 
              para a versão oficial que todos os usuários veem.
            </p>
            <p className="font-semibold text-foreground">
              Esta ação irá substituir o conteúdo atual da Landing Page oficial.
            </p>
            <p>
              Tem certeza que deseja continuar?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handlePublish}
            className="bg-green-600 hover:bg-green-700"
          >
            Sim, Publicar Agora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
