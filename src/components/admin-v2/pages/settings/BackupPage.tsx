import { AdminPageContainer } from "../../components/AdminPageContainer";
import { BackupTab } from "@/components/admin/BackupTab";

export default function BackupPage() {
  return (
    <AdminPageContainer title="Backup & Restore" description="Configurações › Dados › Backup">
      <div className="max-w-5xl">
        <BackupTab />
      </div>
    </AdminPageContainer>
  );
}
