import type { APIRoute } from "astro";
import type { ReportsTodaySummaryDTO } from "@/types";
import { jsonResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/reports/today/summary
 * 
 * Returns summary metrics for today's reports (MOCK DATA for now)
 * TODO: Implement real logic according to api-plan.md
 */
export const GET: APIRoute = async () => {
  // Mock data for development
  const mockSummary: ReportsTodaySummaryDTO = {
    totalActiveDrivers: 12,
    submittedCount: 8,
    pendingCount: 4,
    riskBreakdown: {
      none: 4,
      low: 2,
      medium: 1,
      high: 1,
    },
  };

  return jsonResponse(mockSummary, 200);
};

