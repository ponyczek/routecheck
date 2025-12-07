import { Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  /** Page title to display */
  pageTitle: string;
  /** Callback when hamburger menu is toggled */
  onMenuToggle: () => void;
  /** Whether the menu is currently open */
  isMenuOpen: boolean;
}

/**
 * TopBar component for mobile view
 *
 * Sticky header at the top of the screen with:
 * - Logo (link to dashboard)
 * - Page title
 * - Hamburger menu button
 *
 * Only visible on mobile devices (< 768px).
 *
 * @param props - TopBar props
 * @returns Mobile top bar component
 */
export function TopBar({ pageTitle, onMenuToggle, isMenuOpen }: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:hidden"
      role="banner"
    >
      {/* Hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        aria-label={isMenuOpen ? "Zamknij menu" : "Otwórz menu"}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-menu"
        className="shrink-0"
      >
        {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </Button>

      {/* Logo */}
      <a
        href="/dashboard"
        className="flex items-center gap-2 shrink-0"
        aria-label="RouteCheck - Przejdź do strony głównej"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
        </div>
      </a>

      {/* Page title */}
      <h1 className="flex-1 truncate text-lg font-semibold">{pageTitle}</h1>
    </header>
  );
}
