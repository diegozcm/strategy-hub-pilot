import { Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, type NavSection } from "../config/sidebarContent";
import { BrandBadge } from "../components/BrandBadge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IconNavButtonProps {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

function IconNavButton({ children, isActive = false, onClick, tooltip }: IconNavButtonProps) {
  const button = (
    <button
      onClick={onClick}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

interface IconNavigationProps {
  activeSection: NavSection;
  onSectionChange: (section: NavSection) => void;
}

export function IconNavigation({ activeSection, onSectionChange }: IconNavigationProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-16 flex-col bg-muted/50 border-r border-border">
        {/* Logo */}
        <BrandBadge collapsed />

        <Separator className="mx-3" />

        {/* Navigation Icons */}
        <div className="flex flex-1 flex-col items-center gap-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <IconNavButton
                key={item.id}
                isActive={activeSection === item.id}
                onClick={() => onSectionChange(item.id)}
                tooltip={item.label}
              >
                <Icon className="h-5 w-5" />
              </IconNavButton>
            );
          })}
        </div>

        <Separator className="mx-3" />

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-1 py-4">
          <IconNavButton
            isActive={activeSection === "settings"}
            onClick={() => onSectionChange("settings")}
            tooltip="Configurações"
          >
            <Settings className="h-5 w-5" />
          </IconNavButton>
          <IconNavButton tooltip="Sair">
            <LogOut className="h-5 w-5" />
          </IconNavButton>
        </div>
      </div>
    </TooltipProvider>
  );
}
