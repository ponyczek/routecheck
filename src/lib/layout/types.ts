import type { UserDTO, CompanyDTO } from "@/types";
import type React from "react";

/**
 * Navigation item for sidebar and mobile navigation
 */
export interface NavItem {
  /** Unique identifier for the nav item */
  id: string;
  /** Display label */
  label: string;
  /** Navigation href */
  href: string;
  /** Icon component (React element) */
  icon: React.ReactNode;
  /** Whether this item is currently active */
  isActive: boolean;
  /** Whether this is a flagged/upcoming feature */
  isFlagged?: boolean;
  /** Badge text for flagged items */
  badgeText?: string;
}

/**
 * Auth context value providing user and company data
 */
export interface AuthContextValue {
  /** Current authenticated user */
  user: UserDTO | null;
  /** User's company */
  company: CompanyDTO | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Sign out function */
  signOut: () => Promise<void>;
  /** Refresh user data */
  refresh: () => Promise<void>;
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  /** Page title for breadcrumbs and mobile top bar */
  pageTitle: string;
  /** Show breadcrumbs */
  showBreadcrumbs?: boolean;
  /** Custom breadcrumbs */
  breadcrumbs?: Crumb[];
}

/**
 * Breadcrumb item
 */
export interface Crumb {
  /** Display label */
  label: string;
  /** Navigation href */
  href: string;
  /** Whether this is the current page */
  isCurrent: boolean;
}

/**
 * Network status
 */
export type NetworkStatus = "online" | "offline" | "slow";

/**
 * Mobile sheet state
 */
export interface MobileMenuState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

/**
 * Processed navigation items with active state computed
 */
export interface ProcessedNavItems {
  main: NavItem[];
  flagged: NavItem[];
}

/**
 * Current route info for layout decisions
 */
export interface RouteInfo {
  pathname: string;
  pageTitle: string;
  breadcrumbs: Crumb[];
  parentRoute?: string;
}
