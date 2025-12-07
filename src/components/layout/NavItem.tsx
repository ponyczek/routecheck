import { memo } from "react";
import { cn } from "@/lib/utils";
import type { NavItem as NavItemType } from "@/lib/layout/types";

interface NavItemProps {
  /** Navigation item data */
  item: NavItemType;
  /** Whether this item is disabled */
  disabled?: boolean;
  /** Orientation of the nav item */
  orientation?: "vertical" | "horizontal";
  /** Click handler (optional, for custom navigation) */
  onClick?: () => void;
}

/**
 * NavItem component for sidebar and mobile navigation
 *
 * Renders a navigation link with icon, label, and active state styling.
 * Supports disabled state for flagged features and keyboard navigation.
 *
 * Memoized to prevent unnecessary re-renders.
 *
 * @param props - NavItem props
 * @returns Navigation item component
 */
export const NavItem = memo(function NavItem({
  item,
  disabled = false,
  orientation = "vertical",
  onClick,
}: NavItemProps) {
  const isActive = item.isActive;

  const baseClasses = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    orientation === "vertical" ? "w-full" : "flex-col text-center"
  );

  const stateClasses = cn({
    // Active state
    "bg-primary/10 text-primary font-medium": isActive && !disabled,
    // Hover state (only if not active and not disabled)
    "hover:bg-accent hover:text-accent-foreground": !isActive && !disabled,
    // Disabled state
    "opacity-50 cursor-not-allowed": disabled,
    "cursor-pointer": !disabled,
  });

  const content = (
    <>
      <span className={cn("shrink-0", orientation === "horizontal" ? "text-xl" : "text-lg")}>{item.icon}</span>
      <span className={cn("text-sm", orientation === "horizontal" ? "text-xs" : "")}>{item.label}</span>
      {item.isFlagged && item.badgeText && (
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {item.badgeText}
        </span>
      )}
    </>
  );

  if (disabled) {
    return (
      <div className={cn(baseClasses, stateClasses)} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <a
      href={item.href}
      className={cn(baseClasses, stateClasses)}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
    >
      {content}
    </a>
  );
});
