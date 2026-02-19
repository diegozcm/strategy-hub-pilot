import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { ReleaseNoteForm, type ReleaseFormValues } from "../../components/releases/ReleaseNoteForm";
import { useReleaseNote, useUpdateRelease } from "@/hooks/useAdminReleaseNotes";
import { toast } from "sonner";

export default function EditReleasePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: release, isLoading } = useReleaseNote(id);
  const mutation = useUpdateRelease();

  if (isLoading) {
    return (
      <AdminPageContainer title="Editar Release" description="Novidades › Editar">
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminPageContainer>
    );
  }

  if (!release) {
    return (
      <AdminPageContainer title="Release não encontrada" description="Novidades › Editar">
        <p className="text-muted-foreground">A release solicitada não foi encontrada.</p>
      </AdminPageContainer>
    );
  }

  const handleSubmit = (values: ReleaseFormValues) => {
    mutation.mutate(
      { id: release.id, ...values, summary: values.summary || null, tags: values.tags.length ? values.tags : null },
      {
        onSuccess: () => {
          toast.success("Release atualizada com sucesso");
          navigate("/app/admin/releases");
        },
        onError: () => toast.error("Erro ao atualizar release"),
      }
    );
  };

  return (
    <AdminPageContainer title={`Editar v${release.version}`} description="Novidades › Editar">
      <ReleaseNoteForm
        defaultValues={{
          version: release.version,
          title: release.title,
          date: release.date,
          summary: release.summary ?? "",
          content: release.content,
          published: release.published ?? false,
          tags: release.tags ?? [],
        }}
        onSubmit={handleSubmit}
        isSubmitting={mutation.isPending}
        submitLabel="Salvar Alterações"
      />
    </AdminPageContainer>
  );
}
