import { Menu, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminV2HeaderProps {
  onMenuClick: () => void;
}

export function AdminV2Header({ onMenuClick }: AdminV2HeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-cofound-white px-4 lg:hidden">
      <Button variant="ghost" size="icon" onClick={onMenuClick}>
        <Menu className="h-5 w-5 text-cofound-blue-dark" />
      </Button>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cofound-blue-dark">
          <Target className="h-4 w-4 text-cofound-white" />
        </div>
        <span className="font-semibold text-cofound-blue-dark">Strategy HUB Admin</span>
      </div>
    </header>
  );
}
