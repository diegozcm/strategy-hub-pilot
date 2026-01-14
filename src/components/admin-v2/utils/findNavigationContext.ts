import { getSidebarContent, navItems, type NavSection } from "../config/sidebarContent";

export interface NavigationContext {
  sectionId: NavSection;
  expandKey?: string; // Key format: "sectionTitle-itemIndex"
}

/**
 * Finds the navigation context (section and parent to expand) for a given href.
 * Used to synchronize sidebar state with current URL.
 */
export function findNavigationContext(href: string): NavigationContext | null {
  const sections: NavSection[] = [...navItems.map(n => n.id), "settings"];

  for (const sectionId of sections) {
    const content = getSidebarContent(sectionId);

    for (let sIdx = 0; sIdx < content.sections.length; sIdx++) {
      const section = content.sections[sIdx];

      for (let iIdx = 0; iIdx < section.items.length; iIdx++) {
        const item = section.items[iIdx];

        // Direct item match
        if (item.href === href) {
          return { sectionId };
        }

        // Child item match
        if (item.children) {
          for (const child of item.children) {
            if (child.href === href) {
              return {
                sectionId,
                expandKey: `${section.title}-${iIdx}`,
              };
            }
          }
        }
      }
    }
  }

  return null;
}
