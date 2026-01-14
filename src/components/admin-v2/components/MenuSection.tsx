import { MenuItem, SubMenuItem } from "./MenuItem";
import type { MenuSectionT } from "../config/sidebarContent";

interface MenuSectionProps {
  section: MenuSectionT;
  expandedItems: Set<string>;
  onToggleExpanded: (itemKey: string) => void;
}

export function MenuSection({ section, expandedItems, onToggleExpanded }: MenuSectionProps) {
  return (
    <div className="px-3 py-2">
      <div className="mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {section.title}
        </span>
      </div>
      <div className="space-y-1">
        {section.items.map((item, index) => {
          const itemKey = `${section.title}-${index}`;
          const isExpanded = expandedItems.has(itemKey);
          
          return (
            <div key={itemKey}>
              <MenuItem
                item={item}
                isExpanded={isExpanded}
                onToggle={() => onToggleExpanded(itemKey)}
                onItemClick={() => console.log(`Clicked ${item.label}`)}
              />
              {isExpanded && item.children && (
                <div className="mt-1 space-y-0.5">
                  {item.children.map((child, childIndex) => (
                    <SubMenuItem
                      key={`${itemKey}-child-${childIndex}`}
                      item={child}
                      onItemClick={() => console.log(`Clicked ${child.label}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
