import { useState, useMemo, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getSidebarContent, navItems, type NavSection } from "../config/sidebarContent";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchableItem {
  label: string;
  href: string;
  section: string;
  parent?: string;
}

interface SearchInputProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SearchInput({ collapsed = false, onNavigate }: SearchInputProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Collect all menu items from all sections
  const allMenuItems = useMemo(() => {
    const items: SearchableItem[] = [];
    const sections: NavSection[] = [...navItems.map(n => n.id), "settings"];

    sections.forEach((sectionId) => {
      const content = getSidebarContent(sectionId);
      const sectionLabel = content.title;

      content.sections.forEach((section) => {
        section.items.forEach((item) => {
          if (item.href) {
            items.push({
              label: item.label,
              href: item.href,
              section: sectionLabel,
            });
          }
          if (item.children) {
            item.children.forEach((child) => {
              if (child.href) {
                items.push({
                  label: child.label,
                  href: child.href,
                  section: sectionLabel,
                  parent: item.label,
                });
              }
            });
          }
        });
      });
    });

    return items;
  }, []);

  // Filter based on search value
  const filteredItems = useMemo(() => {
    if (!searchValue.trim()) return [];
    const query = searchValue.toLowerCase();
    return allMenuItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.section.toLowerCase().includes(query) ||
        item.parent?.toLowerCase().includes(query)
    );
  }, [searchValue, allMenuItems]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (href: string) => {
    navigate(href);
    setSearchValue("");
    setIsOpen(false);
    onNavigate?.();
  };

  if (collapsed) {
    return (
      <div className="flex items-center justify-center p-2">
        <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent">
          <Search className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative px-3 py-2">
      <Command className="rounded-lg border border-border bg-background" shouldFilter={false}>
        <div className="flex items-center gap-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar menu..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="flex h-10 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        
        {isOpen && searchValue.trim() && (
          <CommandList className="absolute left-3 right-3 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-popover shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-200">
            {filteredItems.length === 0 ? (
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado.
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredItems.map((item, index) => (
                  <CommandItem
                    key={`${item.href}-${index}`}
                    value={item.label}
                    onSelect={() => handleSelect(item.href)}
                    className="flex cursor-pointer flex-col items-start gap-0.5 px-3 py-2.5 transition-all duration-150 ease-out data-[selected=true]:bg-primary/10"
                  >
                    <span className="font-medium transition-colors duration-150">{item.label}</span>
                    <span className="text-xs text-muted-foreground transition-colors duration-150 group-data-[selected=true]:text-primary">
                      {item.parent ? `${item.section} › ${item.parent}` : item.section}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
