import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSidebarContent, navItems, type NavSection } from "../config/sidebarContent";
import { BrandBadge } from "../components/BrandBadge";
import { SearchInput } from "../components/SearchInput";
import { MenuSection } from "../components/MenuSection";
import { UserAvatar } from "../components/UserAvatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AdminV2MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminV2MobileSidebar({ open, onOpenChange }: AdminV2MobileSidebarProps) {
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const content = getSidebarContent(activeSection);

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between pr-2">
            <BrandBadge />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator className="w-full" />

          {/* Section Tabs */}
          <div className="flex flex-wrap gap-1 p-2">
            {[...navItems, { id: "settings" as const, icon: null, label: "Configurações" }].map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection(item.id)}
                className="text-xs"
              >
                {item.label}
              </Button>
            ))}
          </div>

          <Separator className="w-full" />

          {/* Search */}
          <SearchInput />

          <Separator className="w-full" />

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
                  onToggleExpanded={handleToggleExpanded}
                />
              ))}
            </div>
          </ScrollArea>

          {/* User Avatar */}
          <UserAvatar />
        </div>
      </SheetContent>
    </Sheet>
  );
}
