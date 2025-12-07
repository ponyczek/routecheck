import { useCallback, useMemo, useEffect, useState } from "react";
import type { ReportsFiltersState } from "./types";
import { getDefaultFilters } from "./types";

/**
 * Custom hook for managing reports filters in URL search params
 * Provides parsing, serialization, and update functions
 */
export function useReportsParams(): {
  filters: ReportsFiltersState;
  setFilter: (key: keyof ReportsFiltersState, value: unknown) => void;
  setFilters: (newFilters: Partial<ReportsFiltersState>) => void;
  resetFilters: () => void;
} {
  // Track URL changes
  const [urlChangeCounter, setUrlChangeCounter] = useState(0);

  // Listen for URL changes (popstate and custom event)
  useEffect(() => {
    const handleUrlChange = () => {
      setUrlChangeCounter((prev) => prev + 1);
    };

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("urlchange", handleUrlChange);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("urlchange", handleUrlChange);
    };
  }, []);

  // Parse current URL search params
  const filters = useMemo<ReportsFiltersState>(() => {
    if (typeof window === "undefined") {
      return getDefaultFilters();
    }

    const params = new URLSearchParams(window.location.search);
    const defaults = getDefaultFilters();

    const driverUuids = params.getAll("driverUuid");
    const riskLevels = params.getAll("riskLevel");
    const routeStatuses = params.getAll("routeStatus");

    return {
      from: params.get("from") || defaults.from,
      to: params.get("to") || defaults.to,
      q: params.get("q") || undefined,
      driverUuid: driverUuids.length > 0 ? driverUuids : undefined,
      riskLevel: riskLevels.length > 0 ? (riskLevels as ReportsFiltersState["riskLevel"]) : undefined,
      routeStatus: routeStatuses.length > 0 ? (routeStatuses as ReportsFiltersState["routeStatus"]) : undefined,
      includeAi: params.get("includeAi") !== "false", // default true
    };
  }, [urlChangeCounter]);

  // Update URL with new filters
  const updateUrl = useCallback((newFilters: ReportsFiltersState) => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();

    params.set("from", newFilters.from);
    params.set("to", newFilters.to);
    if (newFilters.q) params.set("q", newFilters.q);
    if (newFilters.driverUuid && newFilters.driverUuid.length > 0) {
      newFilters.driverUuid.forEach((uuid) => params.append("driverUuid", uuid));
    }
    if (newFilters.riskLevel && newFilters.riskLevel.length > 0) {
      newFilters.riskLevel.forEach((level) => params.append("riskLevel", level));
    }
    if (newFilters.routeStatus && newFilters.routeStatus.length > 0) {
      newFilters.routeStatus.forEach((status) => params.append("routeStatus", status));
    }
    if (!newFilters.includeAi) params.set("includeAi", "false");

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newUrl);

    // Trigger a custom event to notify other components
    window.dispatchEvent(new Event("urlchange"));
  }, []);

  // Set a single filter
  const setFilter = useCallback(
    (key: keyof ReportsFiltersState, value: unknown) => {
      const newFilters = { ...filters, [key]: value };
      updateUrl(newFilters);
    },
    [filters, updateUrl]
  );

  // Set multiple filters at once
  const setFilters = useCallback(
    (newFilters: Partial<ReportsFiltersState>) => {
      const updatedFilters = { ...filters, ...newFilters };
      updateUrl(updatedFilters);
    },
    [filters, updateUrl]
  );

  // Reset to default filters
  const resetFilters = useCallback(() => {
    updateUrl(getDefaultFilters());
  }, [updateUrl]);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
  };
}

