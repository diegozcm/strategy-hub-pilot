import { AdminPageContainer } from "../../components/AdminPageContainer";
import { BackupTab } from "@/components/admin/BackupTab";

export default function BackupSchedulesPage() {
  return (
    <AdminPageContainer title="Agendamentos de Backup" description="Configurações › Backup › Agendamentos">
      <div className="max-w-5xl">
        <BackupTab />
      </div>
    </AdminPageContainer>
  );
}
