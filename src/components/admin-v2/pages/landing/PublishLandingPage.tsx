import { useState } from "react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
import { Upload, Eye, AlertTriangle, CheckCircle, Clock, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function PublishLandingPage() {
  const [publishing, setPublishing] = useState(false);
  const navigate = useNavigate();

  // Fetch draft vs published stats
  const { data: stats, refetch } = useQuery({
    queryKey: ["landing-page-publish-stats"],
    queryFn: async () => {
      const [draftRes, pubRes] = await Promise.all([
        supabase.from("landing_page_content_draft").select("*", { count: "exact", head: false }).eq("is_active", true),
        supabase.from("landing_page_content").select("*", { count: "exact", head: false }).eq("is_active", true),
      ]);

      const draftItems = draftRes.data || [];
      const pubItems = pubRes.data || [];

      // Count differences
      const pubMap = new Map(pubItems.map((p) => [`${p.section_name}:${p.content_key}`, p.content_value]));
      let changedCount = 0;
      let newCount = 0;

      draftItems.forEach((d) => {
        const key = `${d.section_name}:${d.content_key}`;
        if (!pubMap.has(key)) {
          newCount++;
        } else if (pubMap.get(key) !== d.content_value) {
          changedCount++;
        }
      });

      return {
        draftCount: draftRes.count || 0,
        publishedCount: pubRes.count || 0,
        changedCount,
        newCount,
        hasPendingChanges: changedCount > 0 || newCount > 0,
        lastPublished: pubItems.length > 0
          ? pubItems.reduce((latest, item) => {
              const d = new Date(item.updated_at);
              return d > latest ? d : latest;
            }, new Date(0))
          : null,
      };
    },
  });

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const { error } = await supabase.rpc("publish_landing_page_content");
      if (error) throw error;

      toast.success("Landing Page publicada com sucesso!", {
        description: "As alterações estão visíveis para todos os usuários.",
      });
      refetch();
    } catch (error: any) {
      console.error("Publish error:", error);
      toast.error("Erro ao publicar", {
        description: error.message || "Tente novamente.",
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AdminPageContainer title="Publicar Landing Page" description="Landing Page › Publicação">
      <div className="max-w-3xl space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.draftCount ?? "..."}</p>
                  <p className="text-xs text-muted-foreground">Itens no Draft</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.publishedCount ?? "..."}</p>
                  <p className="text-xs text-muted-foreground">Itens Publicados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  stats?.hasPendingChanges
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-muted"
                }`}>
                  <Clock className={`h-5 w-5 ${
                    stats?.hasPendingChanges ? "text-amber-600" : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats ? (stats.changedCount + stats.newCount) : "..."}
                  </p>
                  <p className="text-xs text-muted-foreground">Alterações Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        {stats?.hasPendingChanges && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Existem <strong>{stats.changedCount} alterações</strong> e{" "}
              <strong>{stats.newCount} novos itens</strong> pendentes de publicação.
            </AlertDescription>
          </Alert>
        )}

        {!stats?.hasPendingChanges && stats && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Tudo sincronizado! Não há alterações pendentes entre o draft e a versão publicada.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Publicar Alterações
            </CardTitle>
            <CardDescription>
              Copie o conteúdo do draft para a versão oficial da landing page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/app/admin-v2/landing/preview")}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Preview Antes
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={publishing || !stats?.hasPendingChanges}
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Publicar Agora
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Confirmar Publicação
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Você está prestes a publicar{" "}
                        <strong>{(stats?.changedCount || 0) + (stats?.newCount || 0)} alterações</strong>{" "}
                        da Landing Page.
                      </p>
                      <p className="font-semibold text-foreground">
                        Esta ação substituirá o conteúdo oficial visível para todos os usuários.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handlePublish}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Sim, Publicar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {stats?.lastPublished && (
              <p className="text-xs text-muted-foreground">
                Última publicação:{" "}
                {stats.lastPublished.toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
