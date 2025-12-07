import { useCallback, useState, useEffect } from "react";
import type { DriversFiltersState } from "./types";
import { defaultFilters } from "./types";

/**
 * Hook do zarządzania filtrami kierowców z synchronizacją URL
 * Filtry są zapisywane w query params URL, co umożliwia:
 * - Bookmarking filtrowanej strony
 * - Share'owanie linków z filtrami
 * - Zachowanie filtrów przy nawigacji back/forward
 *
 * Używa natywnego Web API (URLSearchParams, History API) zamiast react-router
 */
export function useDriversFilters() {
  // Parse initial filters from URL
  const [filters, setFilters] = useState<DriversFiltersState>(() => {
    if (typeof window === "undefined") return defaultFilters;

    const searchParams = new URLSearchParams(window.location.search);
    return {
      q: searchParams.get("q") || defaultFilters.q,
      isActive: searchParams.has("isActive") ? searchParams.get("isActive") === "true" : defaultFilters.isActive,
      includeDeleted: searchParams.get("includeDeleted") === "true",
      sortBy: (searchParams.get("sortBy") as "name" | "createdAt") || defaultFilters.sortBy,
      sortDir: (searchParams.get("sortDir") as "asc" | "desc") || defaultFilters.sortDir,
      cursor: searchParams.get("cursor") || undefined,
    };
  });

  // Sync filters to URL whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams();

    if (filters.q) searchParams.set("q", filters.q);
    if (filters.isActive !== undefined) searchParams.set("isActive", String(filters.isActive));
    if (filters.includeDeleted) searchParams.set("includeDeleted", "true");
    if (filters.sortBy !== defaultFilters.sortBy) searchParams.set("sortBy", filters.sortBy);
    if (filters.sortDir !== defaultFilters.sortDir) searchParams.set("sortDir", filters.sortDir);
    if (filters.cursor) searchParams.set("cursor", filters.cursor);

    const newUrl = searchParams.toString()
      ? `${window.location.pathname}?${searchParams.toString()}`
      : window.location.pathname;

    // Use replaceState to avoid polluting browser history with every filter change
    window.history.replaceState({}, "", newUrl);
  }, [filters]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      setFilters({
        q: searchParams.get("q") || defaultFilters.q,
        isActive: searchParams.has("isActive") ? searchParams.get("isActive") === "true" : defaultFilters.isActive,
        includeDeleted: searchParams.get("includeDeleted") === "true",
        sortBy: (searchParams.get("sortBy") as "name" | "createdAt") || defaultFilters.sortBy,
        sortDir: (searchParams.get("sortDir") as "asc" | "desc") || defaultFilters.sortDir,
        cursor: searchParams.get("cursor") || undefined,
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /**
   * Aktualizuj filtry (częściowa aktualizacja)
   * Automatycznie resetuje cursor przy zmianie filtrów (oprócz bezpośredniej zmiany cursor)
   */
  const updateFilters = useCallback((updates: Partial<DriversFiltersState>) => {
    setFilters((prev) => {
      const newFilters = { ...prev, ...updates };

      // Reset cursor przy zmianie filtrów (oprócz samej zmiany cursor)
      // To zapewnia że po zmianie filtrów wracamy do pierwszej strony
      if (!("cursor" in updates)) {
        newFilters.cursor = undefined;
      }

      return newFilters;
    });
  }, []);

  /**
   * Resetuj wszystkie filtry do wartości domyślnych
   */
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}
