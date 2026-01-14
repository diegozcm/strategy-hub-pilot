import { useState } from "react";
import { IconNavigation } from "./IconNavigation";
import { DetailSidebar } from "./DetailSidebar";
import type { NavSection } from "../config/sidebarContent";

export function AdminV2Sidebar() {
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleSectionChange = (section: NavSection) => {
    setActiveSection(section);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleToggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen shrink-0">
      <IconNavigation
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <DetailSidebar
        activeSection={activeSection}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        expandedItems={expandedItems}
        onToggleExpanded={handleToggleExpanded}
        onSectionChange={handleSectionChange}
      />
    </div>
  );
}
