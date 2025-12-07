import { useState, useEffect, useMemo } from "react";
import type { RouteInfo, Crumb } from "./types";

/**
 * Mapping of routes to page titles and parent routes
 */
const ROUTE_MAP: Record<string, { title: string; parent?: string }> = {
  "/": { title: "Strona główna" },
  "/dashboard": { title: "Dashboard" },
  "/drivers": { title: "Kierowcy" },
  "/reports": { title: "Raporty" },
  "/settings": { title: "Ustawienia" },
  "/settings/profile": { title: "Profil firmy", parent: "/settings" },
  "/settings/alerts": { title: "Alerty", parent: "/settings" },
  "/settings/account": { title: "Konto", parent: "/settings" },
  "/vehicles": { title: "Pojazdy" },
  "/assignments": { title: "Przypisania" },
};

/**
 * Generate breadcrumbs from pathname
 *
 * @param pathname - Current pathname
 * @param routeMap - Route mapping configuration
 * @returns Array of Crumb items
 */
function generateBreadcrumbs(pathname: string, routeMap: Record<string, { title: string; parent?: string }>): Crumb[] {
  const crumbs: Crumb[] = [];

  // Always start with Dashboard (unless we're on home page)
  if (pathname !== "/" && pathname !== "/dashboard") {
    crumbs.push({
      label: "Dashboard",
      href: "/dashboard",
      isCurrent: false,
    });
  }

  // Get current route info
  const currentRoute = routeMap[pathname];

  if (!currentRoute) {
    // If route not in map, just show Dashboard
    return crumbs;
  }

  // Add parent if exists
  if (currentRoute.parent) {
    const parentRoute = routeMap[currentRoute.parent];
    if (parentRoute) {
      crumbs.push({
        label: parentRoute.title,
        href: currentRoute.parent,
        isCurrent: false,
      });
    }
  }

  // Add current page (not a link)
  crumbs.push({
    label: currentRoute.title,
    href: pathname,
    isCurrent: true,
  });

  return crumbs;
}

/**
 * Parse pathname to RouteInfo
 *
 * @param pathname - Current pathname
 * @returns RouteInfo object
 */
function parseRouteInfo(pathname: string): RouteInfo {
  const route = ROUTE_MAP[pathname] || { title: "Strona" };
  const breadcrumbs = generateBreadcrumbs(pathname, ROUTE_MAP);

  return {
    pathname,
    pageTitle: route.title,
    breadcrumbs,
    parentRoute: route.parent,
  };
}

/**
 * Custom hook for tracking active route
 *
 * This hook:
 * - Parses window.location.pathname
 * - Maps pathname to page title
 * - Generates breadcrumbs
 * - Listens to popstate events (back/forward navigation)
 * - Returns RouteInfo object
 *
 * @returns RouteInfo with pathname, pageTitle, breadcrumbs, and parentRoute
 */
export function useActiveRoute(): RouteInfo {
  const [pathname, setPathname] = useState(() => {
    return typeof window !== "undefined" ? window.location.pathname : "/";
  });

  useEffect(() => {
    // Update pathname on popstate (back/forward browser navigation)
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    // Also listen to custom navigation events (for SPA-style navigation)
    const handleNavigation = () => {
      setPathname(window.location.pathname);
    };

    // Listen to Astro's view transition events if available
    document.addEventListener("astro:page-load", handleNavigation);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("astro:page-load", handleNavigation);
    };
  }, []);

  // Memoize route info to avoid unnecessary recalculations
  const routeInfo = useMemo(() => {
    return parseRouteInfo(pathname);
  }, [pathname]);

  return routeInfo;
}
