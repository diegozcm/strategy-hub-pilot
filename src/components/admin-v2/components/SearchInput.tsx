import { useState } from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  collapsed?: boolean;
}

export function SearchInput({ collapsed = false }: SearchInputProps) {
  const [searchValue, setSearchValue] = useState("");

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
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>
    </div>
  );
}
