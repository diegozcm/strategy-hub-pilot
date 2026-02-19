import { useNavigate } from "react-router-dom";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { ReleaseNoteForm, type ReleaseFormValues } from "../../components/releases/ReleaseNoteForm";
import { useCreateRelease } from "@/hooks/useAdminReleaseNotes";
import { toast } from "sonner";

export default function NewReleasePage() {
  const navigate = useNavigate();
  const mutation = useCreateRelease();

  const handleSubmit = (values: ReleaseFormValues) => {
    mutation.mutate(
      { version: values.version, title: values.title, content: values.content, date: values.date, summary: values.summary || null, tags: values.tags.length ? values.tags : null, published: values.published },
      {
        onSuccess: () => {
          toast.success("Release criada com sucesso");
          navigate("/app/admin/releases");
        },
        onError: () => toast.error("Erro ao criar release"),
      }
    );
  };

  return (
    <AdminPageContainer title="Nova Release" description="Novidades › Nova Publicação">
      <ReleaseNoteForm onSubmit={handleSubmit} isSubmitting={mutation.isPending} submitLabel="Criar Release" />
    </AdminPageContainer>
  );
}
