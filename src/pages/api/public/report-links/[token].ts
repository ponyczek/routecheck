import type { APIRoute } from "astro";

import { supabaseServiceClient } from "../../../../db/supabase.client";
import { hashToken, getValidLinkOrThrow, ReportLinkError } from "../../../../lib/services/reportLinksService";
import { errorResponse, jsonResponse } from "../../../../lib/utils/errors";
import { getClientIP, checkIpRateLimit, getRateLimitHeaders, RATE_LIMITS } from "../../../../lib/utils/rate-limiter";
import type { PublicReportLinkValidationDTO } from "../../../../types";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/public/report-links/{token}
 *
 * Public endpoint to validate a report link token and retrieve driver display information.
 *
 * This endpoint allows the public report form to validate the token before showing the form.
 * It returns minimal information needed for the UI without exposing sensitive data.
 *
 * @param context - Astro API context
 * @returns 200 with PublicReportLinkValidationDTO on success
 * @throws 404 for unknown token
 * @throws 409 for already used token
 * @throws 410 for expired token
 * @throws 429 for rate limit exceeded
 * @throws 500 for server errors
 */
export const GET: APIRoute = async (context) => {
  try {
    // Step 1: Extract and validate token from path
    const { token } = context.params;

    if (!token || typeof token !== "string") {
      return errorResponse("invalid_token", "Token parameter is required", 400);
    }

    // Step 2: Rate limiting check
    const clientIP = getClientIP(context.request);

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

    // Step 3: Hash the token with pepper
    const pepper = import.meta.env.PRIVATE_TOKEN_PEPPER;

    if (!pepper) {
      console.error("[TokenValidation] PRIVATE_TOKEN_PEPPER not configured");
      return errorResponse("internal_error", "Server configuration error", 500);
    }

    const hashedToken = hashToken(token, pepper);

    // Step 4: Retrieve and validate the report link
    const now = new Date();
    let validLink;

    try {
      validLink = await getValidLinkOrThrow(supabaseServiceClient, hashedToken, now);
    } catch (error) {
      if (error instanceof ReportLinkError) {
        return errorResponse(error.code, error.message, error.statusCode);
      }
      console.error("[TokenValidation] Unexpected error validating link:", error);
      return errorResponse("internal_error", "Failed to validate report link", 500);
    }

    // Step 5: Fetch driver information
    const { data: driver, error: driverError } = await supabaseServiceClient
      .from("drivers")
      .select("name")
      .eq("uuid", validLink.driverUuid)
      .single();

    if (driverError || !driver) {
      console.error("[TokenValidation] Driver not found:", driverError);
      return errorResponse("not_found", "Driver not found", 404);
    }

    // Step 6: Fetch vehicle information (if assigned)
    const { data: assignment } = await supabaseServiceClient
      .from("driver_vehicle_assignments")
      .select(
        `
        vehicles!inner(registration_number)
      `
      )
      .eq("driver_uuid", validLink.driverUuid)
      .eq("is_active", true)
      .lte("start_date", now.toISOString())
      .gte("end_date", now.toISOString())
      .single();

    const vehicleRegistration = assignment?.vehicles?.registration_number || null;

    // Step 7: Calculate editableUntil (for existing report if any)
    let editableUntil: string | null = null;

    // Check if there's an existing report for today
    const reportDate = new Date().toISOString().split("T")[0];
    const { data: existingReport } = await supabaseServiceClient
      .from("reports")
      .select("occurred_at")
      .eq("driver_uuid", validLink.driverUuid)
      .eq("report_date", reportDate)
      .single();

    if (existingReport) {
      const occurredAt = new Date(existingReport.occurred_at);
      editableUntil = new Date(occurredAt.getTime() + 10 * 60 * 1000).toISOString();
    }

    // Step 8: Build response
    const response: PublicReportLinkValidationDTO = {
      valid: true,
      driverName: driver.name,
      vehicleRegistration: vehicleRegistration as string | null,
      expiresAt: validLink.expiresAt,
      editableUntil,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    console.error("[TokenValidation] Unexpected error:", error);
    return errorResponse("internal_error", "An unexpected error occurred", 500);
  }
};
