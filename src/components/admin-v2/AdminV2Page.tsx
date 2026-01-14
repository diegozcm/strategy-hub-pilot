import { Outlet } from "react-router-dom";
import { AdminV2Sidebar } from "./layout/AdminV2Sidebar";

const AdminV2Page = () => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AdminV2Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminV2Page;
