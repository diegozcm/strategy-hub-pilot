import { AdminPageContainer } from "../../components/AdminPageContainer";
import { BackupTab } from "@/components/admin/BackupTab";

export default function RestoreBackupPage() {
  return (
    <AdminPageContainer title="Restaurar Backup" description="Configurações › Backup › Restaurar">
      <div className="max-w-5xl">
        <BackupTab />
      </div>
    </AdminPageContainer>
  );
}
