import { Outlet } from "react-router-dom";
import { AdminV2Sidebar } from "./layout/AdminV2Sidebar";

const AdminV2Page = () => {
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
