import { AdminV2Sidebar } from "./layout/AdminV2Sidebar";

const AdminV2Page = () => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AdminV2Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 p-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="text-2xl font-bold text-foreground">Admin V2</h1>
          <p className="mt-2 text-muted-foreground">
            Selecione uma opção na sidebar para começar.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminV2Page;
