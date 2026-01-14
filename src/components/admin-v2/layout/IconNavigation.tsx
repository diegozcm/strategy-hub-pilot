import { useState } from "react";
import { Settings, LogOut, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, type NavSection } from "../config/sidebarContent";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useMultiTenant";

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
        "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function IconNavigation({
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
}: IconNavigationProps) {
  const { profile, signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const name = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.first_name || "Admin";
  
  const avatarUrl = profile?.avatar_url;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSectionClick = (sectionId: NavSection) => {
    if (isCollapsed && sectionId === activeSection) {
      onToggleCollapse();
    } else {
      onSectionChange(sectionId);
      if (isCollapsed) {
        onToggleCollapse();
      }
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-16 flex-col border-r border-border bg-muted/50">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>

        <Separator className="w-full" />

        {/* Navigation Icons */}
        <div className="flex flex-1 flex-col items-center gap-1 py-4">
          {navItems.map((item) => (
            <IconNavButton
              key={item.id}
              isActive={activeSection === item.id}
              onClick={() => handleSectionClick(item.id)}
              tooltip={item.label}
            >
              <item.icon className="h-5 w-5" />
            </IconNavButton>
          ))}
        </div>

        <Separator className="w-full" />

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-2 py-4">
          <IconNavButton
            isActive={activeSection === "settings"}
            onClick={() => handleSectionClick("settings")}
            tooltip="Configurações"
          >
            <Settings className="h-5 w-5" />
          </IconNavButton>
          
          <IconNavButton onClick={() => setShowLogoutDialog(true)} tooltip="Sair">
            <LogOut className="h-5 w-5" />
          </IconNavButton>
        </div>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair do sistema?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Saindo..." : "Sair"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
