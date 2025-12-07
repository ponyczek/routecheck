import type { ReportRiskLevel, ReportRouteStatus } from "@/types";

/**
 * State representing filters in URL for reports view
 */
export interface ReportsFiltersState {
  from: string; // YYYY-MM-DD (default: today)
  to: string; // YYYY-MM-DD (default: today)
  q?: string;
  driverUuid?: string[];
  riskLevel?: ReportRiskLevel[];
  routeStatus?: ReportRouteStatus[];
  includeAi: boolean; // default: true
}

/**
 * Default filters for reports view (today's date range)
 */
export function getDefaultFilters(): ReportsFiltersState {
  const today = new Date().toISOString().split("T")[0];
  return {
    from: today,
    to: today,
    includeAi: true,
  };
}



