import { Outlet } from "react-router-dom";
import { AdminV2Sidebar } from "./layout/AdminV2Sidebar";
import { useAdminRealtimeSync } from "@/hooks/admin/useAdminRealtimeSync";

const AdminV2Page = () => {
  useAdminRealtimeSync();

  return (
    <div className="flex h-screen bg-cofound-white overflow-hidden font-lexend">
      {/* Sidebar - Fixed height */}
      <AdminV2Sidebar />
      
      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminV2Page;
