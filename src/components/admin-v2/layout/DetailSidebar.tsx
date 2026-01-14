import { PanelLeftClose } from "lucide-react";
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  expandedItems: Set<string>;
  onToggleExpanded: (itemKey: string) => void;
  onSectionChange: (section: NavSection) => void;
}

export function DetailSidebar({
  activeSection,
  isCollapsed,
  onToggleCollapse,
  expandedItems,
  onToggleExpanded,
  onSectionChange,
}: DetailSidebarProps) {
  const content = getSidebarContent(activeSection);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-border bg-[#F7F7F7] transition-all duration-300",
        isCollapsed ? "w-0 overflow-hidden" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between pr-2">
        <BrandBadge />
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <Separator className="w-full" />

      {/* Search */}
      <SearchInput onSectionChange={onSectionChange} />

      <Separator className="w-full" />

      {/* Section Title */}
      <div className="px-4 py-4">
        <h2 className="text-xl font-bold tracking-tight text-primary">
          {content.title}
        </h2>
      </div>

      {/* Menu Sections */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pb-4">
          {content.sections.map((section, index) => (
            <MenuSection
              key={`${activeSection}-${index}`}
              section={section}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      </ScrollArea>

      {/* User Avatar */}
      <UserAvatar />
    </div>
  );
}
