import type { APIRoute } from "astro";
import { jsonResponse } from "@/lib/utils/errors";
import type { TelemetryAggregatesDTO, ProblemDetail } from "@/types";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/telemetry
 *
 * Fetches aggregated telemetry metrics for the authenticated company.
 * In MVP, this returns mock data for demonstration purposes.
 * In production, this should aggregate from the telemetry_events table.
 *
 * Query params:
 * - eventType: string (e.g., "FORM_SUBMIT")
 * - bucket: "day" | "week" | "month" (default: "day")
 * - from: ISO date string (YYYY-MM-DD)
 * - to: ISO date string (YYYY-MM-DD)
 *
 * @returns 200 with TelemetryAggregatesDTO on success
 * @throws 400 for validation errors (invalid date range)
 * @throws 401 for unauthorized requests
 * @throws 429 for rate limiting (if implemented)
 * @throws 500 for server errors
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Get Supabase client from locals (set by middleware)
    const supabase = locals.supabase;

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return jsonResponse(
        {
          code: "unauthorized",
          message: "Sesja wygasła. Zaloguj się ponownie.",
        } as ProblemDetail,
        401
      );
    }

    // Parse query params
    const eventType = url.searchParams.get("eventType") || "FORM_SUBMIT";
    const bucket = url.searchParams.get("bucket") || "day";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    // Basic validation
    if (!from || !to) {
      return jsonResponse(
        {
          code: "validation_error",
          message: "Parametry 'from' i 'to' są wymagane",
        } as ProblemDetail,
        400
      );
    }

    // TODO: In production, aggregate from telemetry_events table
    // For MVP, return mock data
    const mockAggregates: TelemetryAggregatesDTO = {
      medianFormDurationSeconds: 85,
      totalFormSubmissions: 142,
      conversionRate: 0.73,
      trend: {
        medianDurationChange: -5, // -5 seconds improvement
        conversionRateChange: 0.02, // +2% improvement
      },
      dailyData: [
        { date: "2025-11-16", medianDurationSeconds: 90, submissionCount: 18 },
        { date: "2025-11-17", medianDurationSeconds: 88, submissionCount: 20 },
        { date: "2025-11-18", medianDurationSeconds: 87, submissionCount: 19 },
        { date: "2025-11-19", medianDurationSeconds: 86, submissionCount: 21 },
        { date: "2025-11-20", medianDurationSeconds: 84, submissionCount: 22 },
        { date: "2025-11-21", medianDurationSeconds: 83, submissionCount: 20 },
        { date: "2025-11-22", medianDurationSeconds: 82, submissionCount: 22 },
      ],
    };

    return jsonResponse(mockAggregates, 200);
  } catch (error) {
    console.error("Unexpected error in GET /api/telemetry:", error);
    return jsonResponse(
      {
        code: "internal_error",
        message: "Wystąpił błąd serwera.",
      } as ProblemDetail,
      500
    );
  }
};


