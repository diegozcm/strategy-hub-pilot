import { AdminPageContainer } from "../../components/AdminPageContainer";
import { BackupTab } from "@/components/admin/BackupTab";

export default function CreateBackupPage() {
  return (
    <AdminPageContainer title="Criar Backup" description="Configurações › Backup › Criar">
      <div className="max-w-5xl">
        <BackupTab />
      </div>
    </AdminPageContainer>
  );
}
