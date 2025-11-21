import { TopBar } from "./TopBar";
import { BottomNavigation } from "./BottomNavigation";
import { MainNavigation } from "./MainNavigation";
import { UserMenu } from "./UserMenu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMobileMenu } from "@/lib/layout/useMobileMenu";
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from "@/lib/layout/useKeyboardShortcuts";
import type { UserDTO, CompanyDTO } from "@/types";
import type { NavItem } from "@/lib/layout/types";
import { LayoutDashboard, Users, FileText, Settings } from "lucide-react";

interface MobileLayoutProps {
  /** Page content to display */
  children: React.ReactNode;
  /** Page title for TopBar */
  pageTitle: string;
  /** Current active route pathname */
  activeRoute: string;
  /** Company name */
  companyName: string;
  /** Current user data */
  user: UserDTO;
  /** Current company data */
  company: CompanyDTO;
  /** Sign out callback */
  onSignOut: () => Promise<void>;
}

/**
 * Navigation items for mobile menu
 */
const MOBILE_NAV_ITEMS: Omit<NavItem, "isActive">[] = [
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
 * MobileLayout component
 *
 * Layout for mobile devices with:
 * - TopBar at the top
 * - Content area
 * - BottomNavigation at the bottom
 * - Sheet (slide-out menu) for additional navigation and settings
 *
 * Only visible on mobile devices (< 768px).
 *
 * @param props - MobileLayout props
 * @returns Mobile layout component
 */
export function MobileLayout({
  children,
  pageTitle,
  activeRoute,
  companyName,
  user,
  company,
  onSignOut,
}: MobileLayoutProps) {
  const { isOpen, toggle, close } = useMobileMenu();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: COMMON_SHORTCUTS.ESCAPE,
      callback: close,
      description: "Zamknij menu",
    },
  ], isOpen); // Only enabled when menu is open

  return (
    <div className="flex min-h-screen flex-col md:hidden">
      {/* Top bar */}
      <TopBar pageTitle={pageTitle} onMenuToggle={toggle} isMenuOpen={isOpen} />

      {/* Content area */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Bottom navigation */}
      <BottomNavigation activeRoute={activeRoute} onMoreClick={toggle} />

      {/* Mobile menu sheet */}
      <Sheet open={isOpen} onOpenChange={toggle}>
        <SheetContent side="left" className="w-72" id="mobile-menu" aria-label="Menu nawigacyjne">
          <SheetHeader>
            <SheetTitle className="text-left">{companyName}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-6">
            {/* Main navigation */}
            <MainNavigation items={MOBILE_NAV_ITEMS} activeRoute={activeRoute} orientation="vertical" onItemClick={close} />

            {/* User menu */}
            <div className="border-t border-border pt-4">
              <UserMenu user={user} company={company} onSignOut={onSignOut} variant="mobile" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

