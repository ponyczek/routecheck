import { LayoutDashboard, Users, FileText, Settings } from "lucide-react";
import { MainNavigation } from "./MainNavigation";
import { UserMenu } from "./UserMenu";
import type { UserDTO, CompanyDTO } from "@/types";
import type { NavItem } from "@/lib/layout/types";

interface DesktopSidebarProps {
  /** Company name for logo area */
  companyName: string;
  /** Current active route pathname */
  activeRoute: string;
  /** Current user data */
  user: UserDTO;
  /** Current company data */
  company: CompanyDTO;
  /** Sign out callback */
  onSignOut: () => Promise<void>;
}

/**
 * Navigation items for the main sidebar
 */
const NAV_ITEMS: Omit<NavItem, "isActive">[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard />,
  },
  {
    id: "drivers",
    label: "Kierowcy",
    href: "/drivers",
    icon: <Users />,
  },
  {
    id: "reports",
    label: "Raporty",
    href: "/reports",
    icon: <FileText />,
  },
  {
    id: "settings",
    label: "Ustawienia",
    href: "/settings",
    icon: <Settings />,
  },
];

/**
 * DesktopSidebar component
 *
 * Renders the main sidebar for desktop view with:
 * - Logo and company name at the top
 * - Main navigation items
 * - User menu at the bottom
 *
 * Fixed position on the left side of the screen.
 * Hidden on mobile devices (< 768px).
 *
 * @param props - DesktopSidebar props
 * @returns Desktop sidebar component
 */
export function DesktopSidebar({ companyName, activeRoute, user, company, onSignOut }: DesktopSidebarProps) {
  return (
    <aside 
      className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-background md:flex"
      role="complementary"
      aria-label="Nawigacja główna"
    >
      {/* Logo and company name */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <a 
          href="/dashboard" 
          className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
          aria-label="RouteCheck - Przejdź do strony głównej"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-lg">RouteCheck</span>
        </a>
      </div>

      {/* Main navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        <MainNavigation items={NAV_ITEMS} activeRoute={activeRoute} orientation="vertical" />
      </div>

      {/* User menu at the bottom */}
      <div className="border-t border-border p-3">
        <UserMenu user={user} company={company} onSignOut={onSignOut} variant="sidebar" />
      </div>
    </aside>
  );
}

