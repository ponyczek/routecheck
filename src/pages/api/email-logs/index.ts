import type { APIRoute } from "astro";
import { jsonResponse } from "@/lib/utils/errors";
import type { EmailLogsListResponseDTO, ProblemDetail } from "@/types";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/email-logs
 *
 * Fetches email logs for the authenticated company (paginated).
 * In MVP, this returns mock data for demonstration purposes.
 * In production, this should fetch from the email_logs table.
 *
 * Query params:
 * - limit: number (default: 10, max: 100)
 * - sortBy: string (default: "sentAt")
 * - sortDir: "asc" | "desc" (default: "desc")
 * - status: "SENT" | "FAILED" (optional filter)
 *
 * @returns 200 with EmailLogsListResponseDTO on success
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
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 100);
    const sortBy = url.searchParams.get("sortBy") || "sentAt";
    const sortDir = url.searchParams.get("sortDir") || "desc";
    const statusFilter = url.searchParams.get("status");

    // TODO: In production, fetch from email_logs table
    // For MVP, return mock data
    const mockLogs: EmailLogsListResponseDTO = {
      items: [
        {
          uuid: "log-1",
          recipient: "driver1@example.com",
          subject: "Alert: Brakujący raport dzienny - 2025-11-22",
          status: "SENT",
          sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
          errorMessage: null,
          companyUuid: "company-uuid",
        },
        {
          uuid: "log-2",
          recipient: "driver2@example.com",
          subject: "Alert: Brakujący raport dzienny - 2025-11-22",
          status: "SENT",
          sentAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          errorMessage: null,
          companyUuid: "company-uuid",
        },
        {
          uuid: "log-3",
          recipient: "driver3@example.com",
          subject: "Alert: Brakujący raport dzienny - 2025-11-21",
          status: "FAILED",
          sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          errorMessage: "SMTP connection timeout",
          companyUuid: "company-uuid",
        },
      ],
      nextCursor: null,
    };

    return jsonResponse(mockLogs, 200);
  } catch (error) {
    console.error("Unexpected error in GET /api/email-logs:", error);
    return jsonResponse(
      {
        code: "internal_error",
        message: "Wystąpił błąd serwera.",
      } as ProblemDetail,
      500
    );
  }
};


