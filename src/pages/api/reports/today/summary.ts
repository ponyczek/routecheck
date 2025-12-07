import type { APIRoute } from "astro";
import type { ReportsTodaySummaryDTO } from "@/types";
import { jsonResponse, errorResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/reports/today/summary
 * 
 * Returns summary metrics for today's reports
 * Calculates:
 * - Total active drivers
 * - Number of submitted reports today
 * - Number of pending reports (active drivers without report)
 * - Risk breakdown by level
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const supabase = locals.supabase;
    
    // 1. Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return errorResponse("unauthorized", "Authentication required", 401);
    }

    // 2. Get user's company_uuid
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_uuid')
      .eq('uuid', session.user.id)
      .single();

    if (userError || !userData) {
      return errorResponse("forbidden", "User not associated with a company", 403);
    }

    const companyUuid = userData.company_uuid;
    const timezone = url.searchParams.get('timezone') || 'Europe/Warsaw';
    
    // 3. Calculate today's date in given timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD

    // 4. Count total active drivers
    const { count: totalActiveDrivers, error: driversError } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })
      .eq('company_uuid', companyUuid)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (driversError) {
      console.error('[TodaySummary] Error counting drivers:', driversError);
      return errorResponse("internal_error", "Failed to fetch drivers", 500);
    }

    // 5. Fetch today's reports with risk levels
    const { data: todaysReports, error: reportsError } = await supabase
      .from('reports')
      .select('uuid, driver_uuid, risk_level')
      .eq('company_uuid', companyUuid)
      .eq('report_date', today);

    if (reportsError) {
      console.error('[TodaySummary] Error fetching reports:', reportsError);
      return errorResponse("internal_error", "Failed to fetch reports", 500);
    }

    // 6. Calculate metrics
    const submittedCount = todaysReports?.length || 0;
    const pendingCount = (totalActiveDrivers || 0) - submittedCount;

    // 7. Calculate risk breakdown
    const riskBreakdown = {
      none: 0,
      low: 0,
      medium: 0,
      high: 0,
    };

    todaysReports?.forEach((report) => {
      const level = report.risk_level?.toLowerCase();
      if (level === 'none') riskBreakdown.none++;
      else if (level === 'low') riskBreakdown.low++;
      else if (level === 'medium') riskBreakdown.medium++;
      else if (level === 'high') riskBreakdown.high++;
      else riskBreakdown.none++; // Default to none if null
    });

    // 8. Construct response
    const summary: ReportsTodaySummaryDTO = {
      totalActiveDrivers: totalActiveDrivers || 0,
      submittedCount,
      pendingCount: Math.max(0, pendingCount), // Ensure non-negative
      riskBreakdown,
    };

    return jsonResponse(summary, 200);
  } catch (error) {
    console.error('[TodaySummary] Unexpected error:', error);
    return errorResponse("internal_error", "Internal server error", 500);
  }
};

