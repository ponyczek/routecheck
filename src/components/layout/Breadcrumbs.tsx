import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Crumb } from "@/lib/layout/types";

interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  crumbs: Crumb[];
  /** Optional className for styling */
  className?: string;
}

/**
 * Breadcrumbs component
 *
 * Displays a breadcrumb navigation path showing the current page hierarchy.
 * Uses proper ARIA labels for accessibility.
 *
 * Memoized to prevent unnecessary re-renders.
 *
 * Format: Dashboard > Parent > Current Page
 *
 * @param props - Breadcrumbs props
 * @returns Breadcrumb navigation component
 */
export const Breadcrumbs = memo(function Breadcrumbs({ crumbs, className }: BreadcrumbsProps) {
  // Don't render if no crumbs or only one crumb (current page)
  if (!crumbs || crumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-2 text-sm", className)}>
      <ol className="flex items-center gap-2">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={crumb.href} className="flex items-center gap-2">
              {/* Separator (not for first item) */}
              {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}

              {/* Breadcrumb link or text */}
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <a
                  href={crumb.href}
                  className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  {crumb.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
