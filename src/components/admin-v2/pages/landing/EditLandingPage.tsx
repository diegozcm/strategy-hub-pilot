import { AdminPageContainer } from "../../components/AdminPageContainer";
import { LandingPageEditorPage } from "@/components/admin/LandingPageEditorPage";

export default function EditLandingPage() {
  return (
    <AdminPageContainer title="Editor da Landing Page" description="Landing Page › Editar Conteúdo">
      <LandingPageEditorPage />
    </AdminPageContainer>
  );
}
