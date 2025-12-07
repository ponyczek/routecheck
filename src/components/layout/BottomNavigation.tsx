import { LayoutDashboard, Users, FileText, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  /** Current active route pathname */
  activeRoute: string;
  /** Callback when "More" button is clicked */
  onMoreClick: () => void;
}

/**
 * Navigation items for bottom navigation
 */
const BOTTOM_NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "drivers",
    label: "Kierowcy",
    href: "/drivers",
    icon: Users,
  },
  {
    id: "reports",
    label: "Raporty",
    href: "/reports",
    icon: FileText,
  },
] as const;

/**
 * BottomNavigation component for mobile view
 *
 * Fixed navigation bar at the bottom of the screen with:
 * - Main navigation items (Dashboard, Kierowcy, Raporty)
 * - "More" button that opens the mobile Sheet
 *
 * Only visible on mobile devices (< 768px).
 *
 * @param props - BottomNavigation props
 * @returns Mobile bottom navigation component
 */
export function BottomNavigation({ activeRoute, onMoreClick }: BottomNavigationProps) {
  return (
    <nav
      role="navigation"
      aria-label="Główna nawigacja mobilna"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background md:hidden"
    >
      <ul className="flex items-center justify-around">
        {/* Main navigation items */}
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = computeIsActive(item.href, activeRoute);
          const Icon = item.icon;

          return (
            <li key={item.id} className="flex-1">
              <a
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground active:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </a>
            </li>
          );
        })}

        {/* More button */}
        <li className="flex-1">
          <button
            onClick={onMoreClick}
            className={cn(
              "flex w-full flex-col items-center gap-1 py-3 transition-colors",
              "text-muted-foreground hover:text-foreground active:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label="Więcej opcji"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs">Więcej</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

/**
 * Compute whether a nav item is active based on current route
 *
 * @param itemHref - Navigation item href
 * @param activeRoute - Current active route pathname
 * @returns Whether the item is active
 */
function computeIsActive(itemHref: string, activeRoute: string): boolean {
  return itemHref === activeRoute;
}
