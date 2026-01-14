import { useState } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSidebarContent, type NavSection } from "../config/sidebarContent";
import { BrandBadge } from "../components/BrandBadge";
import { SearchInput } from "../components/SearchInput";
import { MenuSection } from "../components/MenuSection";
import { UserAvatar } from "../components/UserAvatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetailSidebarProps {
  activeSection: NavSection;
}

export function DetailSidebar({ activeSection }: DetailSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const content = getSidebarContent(activeSection);

  const toggleExpanded = (itemKey: string) => {
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

  const toggleCollapse = () => setIsCollapsed((s) => !s);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-border bg-background transition-all duration-300",
        isCollapsed ? "w-0 overflow-hidden" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pr-2">
        <BrandBadge />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator />

      {/* Search */}
      <SearchInput />

      <Separator />

      {/* Section Title */}
      <div className="px-4 py-3">
        <h2 className="text-lg font-semibold text-foreground">{content.title}</h2>
      </div>

      {/* Menu Sections */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pb-4">
          {content.sections.map((section, index) => (
            <MenuSection
              key={`${activeSection}-${index}`}
              section={section}
              expandedItems={expandedItems}
              onToggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      </ScrollArea>

      {/* User Avatar */}
      <UserAvatar name="Admin" email="admin@strategyhub.com" />
    </div>
  );
}
