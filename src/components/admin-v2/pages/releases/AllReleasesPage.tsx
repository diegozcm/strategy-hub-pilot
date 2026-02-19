import { useNavigate } from "react-router-dom";
import { Plus, Loader2 } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Button } from "@/components/ui/button";
import { ReleaseNoteTable } from "../../components/releases/ReleaseNoteTable";
import { useAllReleaseNotes, useDeleteRelease } from "@/hooks/useAdminReleaseNotes";
import { toast } from "sonner";

export default function AllReleasesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useAllReleaseNotes();
  const deleteMutation = useDeleteRelease();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Release excluída com sucesso"),
      onError: () => toast.error("Erro ao excluir release"),
    });
  };

  return (
    <AdminPageContainer title="Novidades" description="Novidades › Todas as Releases">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => navigate("/app/admin/releases/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Release
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ReleaseNoteTable
            data={data ?? []}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </div>
    </AdminPageContainer>
  );
}
