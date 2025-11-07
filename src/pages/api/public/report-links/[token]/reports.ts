import type { APIRoute } from "astro";

import { supabaseServiceClient } from "../../../../../db/supabase.client";
import { publicReportSubmitSchema } from "../../../../../lib/validation/public-report.schema";
import {
  hashToken,
  getValidLinkOrThrow,
  markLinkUsed,
  ReportLinkError,
} from "../../../../../lib/services/reportLinksService";
import {
  deriveReportDate,
  createReportFromPublic,
  scheduleAiReprocess,
  ReportDuplicateError,
} from "../../../../../lib/services/reportsService";
import { formatZodError, errorResponse, jsonResponse } from "../../../../../lib/utils/errors";
import {
  getClientIP,
  checkIpRateLimit,
  checkTokenRateLimit,
  getRateLimitHeaders,
  RATE_LIMITS,
} from "../../../../../lib/utils/rate-limiter";
import type { PublicReportSubmitResponseDTO } from "../../../../../types";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST /api/public/report-links/{token}/reports
 *
 * Public endpoint for one-time daily report submission by a driver using a token link.
 *
 * Flow:
 * 1. Validate token → validate data → create report record
 * 2. Mark link as used → respond with reportUuid and editableUntil
 *
 * Operates with service-role privileges on the server side.
 * Does not expose private data or secrets to the client.
 *
 * @param context - Astro API context
 * @returns 201 with PublicReportSubmitResponseDTO on success
 * @throws 400 for invalid input data
 * @throws 404 for unknown token
 * @throws 409 for already used token or duplicate report
 * @throws 410 for expired token
 * @throws 500 for server errors
 */
export const POST: APIRoute = async (context) => {
  const startTime = Date.now();

  try {
    // Step 1: Extract and validate token from path
    const { token } = context.params;

    if (!token || typeof token !== "string") {
      return errorResponse("invalid_token", "Token parameter is required", 400);
    }

    // Step 1.5: Rate limiting checks
    const clientIP = getClientIP(context.request);

    // Check IP rate limit (30 requests per minute)
    if (!checkIpRateLimit(clientIP)) {
      const headers = getRateLimitHeaders(`ip:${clientIP}`, RATE_LIMITS.IP_PER_MINUTE);
      return new Response(
        JSON.stringify({
          code: "rate_limited",
          message: "Too many requests from this IP address. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        }
      );
    }

    // Check token rate limit (5 requests per minute per token)
    if (!checkTokenRateLimit(token)) {
      const headers = getRateLimitHeaders(`token:${token}`, RATE_LIMITS.TOKEN_PER_MINUTE);
      return new Response(
        JSON.stringify({
          code: "rate_limited",
          message: "Too many requests for this token. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        }
      );
    }

    // Step 2: Hash the token with pepper
    const pepper = import.meta.env.PRIVATE_TOKEN_PEPPER;

    if (!pepper) {
      console.error("[ReportSubmit] PRIVATE_TOKEN_PEPPER not configured");
      return errorResponse("internal_error", "Server configuration error", 500);
    }

    const hashedToken = hashToken(token, pepper);

    // Step 3: Retrieve and validate the report link
    const now = new Date();
    let validLink;

    try {
      validLink = await getValidLinkOrThrow(supabaseServiceClient, hashedToken, now);
    } catch (error) {
      if (error instanceof ReportLinkError) {
        return errorResponse(error.code, error.message, error.statusCode);
      }
      console.error("[ReportSubmit] Unexpected error validating link:", error);
      return errorResponse("internal_error", "Failed to validate report link", 500);
    }

    // Step 4: Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      return errorResponse("invalid_json", "Request body must be valid JSON", 400);
    }

    const validation = publicReportSubmitSchema.safeParse(body);

    if (!validation.success) {
      return jsonResponse(formatZodError(validation.error), 400);
    }

    const payload = validation.data;

    // Step 5: Derive report date in driver's timezone
    let reportDate: string;
    try {
      reportDate = deriveReportDate(now, payload.timezone);
    } catch {
      return errorResponse("validation_error", "Invalid timezone", 400, {
        timezone: "Must be a valid IANA timezone identifier",
      });
    }

    // Step 6: Create the report
    let report;
    try {
      report = await createReportFromPublic(
        supabaseServiceClient,
        {
          driverUuid: validLink.driverUuid,
          companyUuid: validLink.companyUuid,
        },
        payload,
        reportDate,
        now
      );
    } catch (error) {
      if (error instanceof ReportDuplicateError) {
        return errorResponse(
          "conflict",
          "A report for this driver and date already exists",
          409,
          error.existingReportUuid ? { existingReportUuid: error.existingReportUuid } : undefined
        );
      }
      console.error("[ReportSubmit] Failed to create report:", error);
      return errorResponse("internal_error", "Failed to create report", 500);
    }

    // Step 7: Mark the link as used
    try {
      await markLinkUsed(supabaseServiceClient, validLink.uuid, now);
    } catch (error) {
      console.error("[ReportSubmit] Failed to mark link as used:", error);
      // Note: Report was created successfully, so we log but don't fail the request
      // This is a non-critical error - the link can be cleaned up later
    }

    // Step 8: Calculate editableUntil (occurred_at + 10 minutes)
    const occurredAt = new Date(report.occurredAt);
    const editableUntil = new Date(occurredAt.getTime() + 10 * 60 * 1000);

    // Step 9: Schedule AI reprocessing (asynchronous, non-blocking)
    scheduleAiReprocess(report.uuid).catch((error) => {
      console.error("[ReportSubmit] Failed to schedule AI reprocess:", error);
      // Non-critical: AI processing can be triggered manually later
    });

    // Step 10: Prepare and return success response
    const response: PublicReportSubmitResponseDTO = {
      reportUuid: report.uuid,
      editableUntil: editableUntil.toISOString(),
    };

    const duration = Date.now() - startTime;
    console.log(`[ReportSubmit] Successfully created report ${report.uuid} in ${duration}ms`);

    return jsonResponse(response, 201);
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("[ReportSubmit] Unexpected error:", error);
    return errorResponse("internal_error", "An unexpected error occurred", 500);
  }
};
