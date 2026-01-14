import { ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { MenuItemT } from "../config/sidebarContent";

interface MenuItemProps {
  item: MenuItemT;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function MenuItem({ item, isExpanded, onToggle }: MenuItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const Icon = item.icon;
  const isActive = item.href ? location.pathname === item.href : false;

  const handleClick = () => {
    if (item.hasDropdown && onToggle) {
      onToggle();
    } else if (item.href) {
      navigate(item.href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="flex-1 truncate text-sm">{item.label}</span>
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
}

export function SubMenuItem({ item }: SubMenuItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const Icon = item.icon;
  const isActive = item.href ? location.pathname === item.href : false;

  const handleClick = () => {
    if (item.href) {
      navigate(item.href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg py-1.5 pl-10 pr-3 text-left transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate text-sm">{item.label}</span>
    </button>
  );
}
