import type { ReportsFiltersState } from "./types";

/**
 * Query keys for TanStack Query
 * Provides consistent cache key generation for reports queries
 */
export const reportsQueryKeys = {
  /**
   * Base key for all reports queries
   */
  all: ["reports"] as const,

  /**
   * Key for reports list with specific filters
   */
  list: (filters: ReportsFiltersState) => [...reportsQueryKeys.all, "list", filters] as const,

  /**
   * Key for a single report detail
   */
  detail: (uuid: string, includeAi = true, includeTags = true) =>
    [...reportsQueryKeys.all, "detail", uuid, { includeAi, includeTags }] as const,

  /**
   * Key for today's summary
   */
  todaySummary: (date: string, timezone: string) => [...reportsQueryKeys.all, "todaySummary", date, timezone] as const,
};
