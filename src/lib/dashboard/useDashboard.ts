import { useQuery } from "@tanstack/react-query";
import { dashboardQueryKeys } from "./queryKeys";
import type { DashboardData } from "./types";
import { getCurrentDateInTimezone } from "@/lib/utils/date";
import { fetchReportsTodaySummary, fetchTodayReports, fetchPendingDrivers } from "./api";

/**
 * Options for useDashboard hook
 */
export interface UseDashboardOptions {
  /** IANA timezone identifier (default: "Europe/Warsaw") */
  timezone?: string;
  /** Whether to enable auto-refetching (default: true) */
  enabled?: boolean;
  /** Refetch interval in milliseconds (default: 60000 = 60s) */
  refetchInterval?: number;
}

/**
 * Custom hook for fetching and managing dashboard data
 *
 * This hook:
 * - Fetches today's summary, reports, and pending drivers
 * - Uses TanStack Query with automatic refetching every 60s
 * - Provides unified loading, error, and refetch states
 * - Automatically redirects to /signin on 401 errors (via error boundaries)
 *
 * @param options - Configuration options
 * @returns Dashboard data, loading states, and refetch function
 */
export function useDashboard(options: UseDashboardOptions = {}) {
  const {
    timezone = "Europe/Warsaw",
    enabled = true,
    refetchInterval = 60_000, // 60s
  } = options;

  const currentDate = getCurrentDateInTimezone(timezone);

  // Query 1: Summary (metrics + risk breakdown)
  const summaryQuery = useQuery({
    queryKey: dashboardQueryKeys.summary(currentDate),
    queryFn: () => fetchReportsTodaySummary(currentDate, timezone),
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 30_000, // 30s
    enabled,
    retry: 1,
  });

  // Query 2: Today's Reports (with AI data)
  const reportsQuery = useQuery({
    queryKey: dashboardQueryKeys.todayReports(currentDate),
    queryFn: () => fetchTodayReports(currentDate, timezone),
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 30_000,
    enabled,
    retry: 1,
  });

  // Query 3: Pending Drivers (active drivers without reports)
  const pendingQuery = useQuery({
    queryKey: dashboardQueryKeys.pendingDrivers(currentDate),
    queryFn: () => fetchPendingDrivers(currentDate, timezone),
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 30_000,
    enabled,
    retry: 1,
  });

  // Aggregate loading states
  const isLoading =
    summaryQuery.isLoading || reportsQuery.isLoading || pendingQuery.isLoading;

  const isRefreshing =
    summaryQuery.isFetching || reportsQuery.isFetching || pendingQuery.isFetching;

  // Aggregate errors (exclude UNAUTHORIZED as it's handled by error boundary/redirect)
  const error =
    summaryQuery.error?.message !== "UNAUTHORIZED" && summaryQuery.error
      ? summaryQuery.error
      : reportsQuery.error?.message !== "UNAUTHORIZED" && reportsQuery.error
        ? reportsQuery.error
        : pendingQuery.error?.message !== "UNAUTHORIZED" && pendingQuery.error
          ? pendingQuery.error
          : null;

  // Construct unified dashboard data
  const data: DashboardData | undefined =
    summaryQuery.data && reportsQuery.data && pendingQuery.data
      ? {
          summary: summaryQuery.data,
          todayReports: reportsQuery.data,
          pendingDrivers: pendingQuery.data,
          lastUpdatedAt: new Date().toISOString(),
        }
      : undefined;

  /**
   * Manually refetch all dashboard queries
   */
  const refetch = async () => {
    await Promise.all([
      summaryQuery.refetch(),
      reportsQuery.refetch(),
      pendingQuery.refetch(),
    ]);
  };

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

