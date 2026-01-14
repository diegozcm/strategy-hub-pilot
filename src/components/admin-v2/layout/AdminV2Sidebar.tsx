import { useState } from "react";
import { IconNavigation } from "./IconNavigation";
import { DetailSidebar } from "./DetailSidebar";
import type { NavSection } from "../config/sidebarContent";

export function AdminV2Sidebar() {
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");

  return (
    <div className="flex h-screen">
      <IconNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <DetailSidebar activeSection={activeSection} />
    </div>
  );
}
