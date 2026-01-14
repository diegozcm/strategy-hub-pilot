import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItemT } from "../config/sidebarContent";

interface MenuItemProps {
  item: MenuItemT;
  isExpanded?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
}

export function MenuItem({ item, isExpanded, onToggle, onItemClick }: MenuItemProps) {
  const Icon = item.icon;
  
  const handleClick = () => {
    if (item.hasDropdown && onToggle) {
      onToggle();
    } else {
      onItemClick?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        item.isActive
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="flex-1 text-left truncate">{item.label}</span>
      {item.hasDropdown && (
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      )}
    </button>
  );
}

interface SubMenuItemProps {
  item: MenuItemT;
  onItemClick?: () => void;
}

export function SubMenuItem({ item, onItemClick }: SubMenuItemProps) {
  return (
    <button
      onClick={onItemClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <span className="ml-7 truncate">{item.label}</span>
    </button>
  );
}
