import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { IconNavigation } from "./IconNavigation";
import { DetailSidebar } from "./DetailSidebar";
import type { NavSection } from "../config/sidebarContent";
import { findNavigationContext } from "../utils/findNavigationContext";

export function AdminV2Sidebar() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Sync sidebar state with current URL on load and navigation
  useEffect(() => {
    const context = findNavigationContext(location.pathname);
    if (context) {
      setActiveSection(context.sectionId);
      if (context.expandKey) {
        setExpandedItems((prev) => {
          const next = new Set(prev);
          next.add(context.expandKey!);
          return next;
        });
      }
    }
  }, [location.pathname]);

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

  const handleExpandItem = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.add(key);
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
        onExpandItem={handleExpandItem}
      />
    </div>
  );
}
