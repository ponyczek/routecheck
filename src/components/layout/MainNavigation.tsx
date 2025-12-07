import { memo, useMemo } from "react";
import { NavItem } from "./NavItem";
import type { NavItem as NavItemType } from "@/lib/layout/types";

interface MainNavigationProps {
  /** Array of navigation items */
  items: NavItemType[];
  /** Current active route pathname */
  activeRoute: string;
  /** Orientation of the navigation */
  orientation?: "vertical" | "horizontal";
  /** Optional click handler for navigation items */
  onItemClick?: () => void;
}

/**
 * MainNavigation component
 *
 * Renders a list of navigation items with proper ARIA labels and keyboard navigation.
 * Determines active state based on current route pathname.
 *
 * Memoized to prevent unnecessary re-renders when route hasn't changed.
 *
 * @param props - MainNavigation props
 * @returns Navigation component
 */
export const MainNavigation = memo(function MainNavigation({
  items,
  activeRoute,
  orientation = "vertical",
  onItemClick,
}: MainNavigationProps) {
  // Compute active state for each item (memoized)
  const itemsWithActiveState = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        isActive: computeIsActive(item.href, activeRoute),
      })),
    [items, activeRoute]
  );

  return (
    <nav role="navigation" aria-label="Główna nawigacja">
      <ul className={orientation === "vertical" ? "space-y-1" : "flex items-center gap-2"}>
        {itemsWithActiveState.map((item) => (
          <li key={item.id}>
            <NavItem item={item} orientation={orientation} disabled={item.isFlagged} onClick={onItemClick} />
          </li>
        ))}
      </ul>
    </nav>
  );
});

/**
 * Compute whether a nav item is active based on current route
 *
 * Special handling for:
 * - Exact match for most routes
 * - Prefix match for /settings/* routes
 *
 * @param itemHref - Navigation item href
 * @param activeRoute - Current active route pathname
 * @returns Whether the item is active
 */
function computeIsActive(itemHref: string, activeRoute: string): boolean {
  // Exact match
  if (itemHref === activeRoute) {
    return true;
  }

  // For /settings, match any sub-route
  if (itemHref === "/settings" && activeRoute.startsWith("/settings")) {
    return true;
  }

  return false;
}
