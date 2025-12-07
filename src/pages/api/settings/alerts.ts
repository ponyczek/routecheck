import type { APIRoute } from "astro";
import { jsonResponse } from "@/lib/utils/errors";
import type { AlertsConfigDTO, UpdateAlertsConfigCommand, ProblemDetail } from "@/types";
import { z } from "zod";

// Disable prerendering for this API route
export const prerender = false;

// Zod schema for validating UpdateAlertsConfigCommand
const updateAlertsConfigSchema = z.object({
  alertsEnabled: z.boolean({
    required_error: "alertsEnabled jest wymagane",
    invalid_type_error: "alertsEnabled musi być wartością boolean",
  }),
});

/**
 * GET /api/settings/alerts
 *
 * Fetches the current authenticated user's alerts configuration.
 * In MVP, this returns a hardcoded value with user's email.
 * In production, this should be stored in a dedicated settings table or company metadata.
 *
 * Flow:
 * 1. Verify authentication via Supabase session
 * 2. Fetch user's email from auth.users
 * 3. Return AlertsConfigDTO (hardcoded alertsEnabled for MVP)
 *
 * @returns 200 with AlertsConfigDTO on success
 * @throws 401 for unauthorized requests (no session or expired token)
 * @throws 500 for server errors
 */
export const GET: APIRoute = async ({ locals }) => {
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

    // Get user email from session
    const userEmail = session.user.email;

    if (!userEmail) {
      return jsonResponse(
        {
          code: "internal_error",
          message: "Nie znaleziono adresu e-mail użytkownika.",
        } as ProblemDetail,
        500
      );
    }

    // TODO: In production, fetch alertsEnabled from database (company settings or dedicated table)
    // For MVP, we return a hardcoded value
    const config: AlertsConfigDTO = {
      alertsEnabled: true, // Hardcoded for MVP - should be fetched from DB
      alertRecipientEmail: userEmail,
    };

    return jsonResponse(config, 200);
  } catch (error) {
    console.error("Unexpected error in GET /api/settings/alerts:", error);
    return jsonResponse(
      {
        code: "internal_error",
        message: "Wystąpił błąd serwera.",
      } as ProblemDetail,
      500
    );
  }
};

/**
 * PATCH /api/settings/alerts
 *
 * Updates the current authenticated user's alerts configuration.
 * In MVP, this endpoint accepts the update but doesn't persist it (no DB table yet).
 * In production, this should update a dedicated settings table or company metadata.
 *
 * Flow:
 * 1. Verify authentication via Supabase session
 * 2. Validate request body (UpdateAlertsConfigCommand)
 * 3. TODO: Persist alertsEnabled to database
 * 4. Return updated AlertsConfigDTO
 *
 * @returns 200 with updated AlertsConfigDTO on success
 * @throws 400 for validation errors
 * @throws 401 for unauthorized requests (no session or expired token)
 * @throws 500 for server errors
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    // Get Supabase client from locals (set by middleware)
    const supabase = locals.supabase;

    // Parse request body
    let body: UpdateAlertsConfigCommand;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          code: "invalid_json",
          message: "Nieprawidłowy format JSON",
        } as ProblemDetail,
        400
      );
    }

    // Validate input
    const validation = updateAlertsConfigSchema.safeParse(body);
    if (!validation.success) {
      return jsonResponse(
        {
          code: "validation_error",
          message: "Błąd walidacji danych.",
          details: validation.error.flatten().fieldErrors,
        } as ProblemDetail,
        400
      );
    }

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

    // Get user email from session
    const userEmail = session.user.email;

    if (!userEmail) {
      return jsonResponse(
        {
          code: "internal_error",
          message: "Nie znaleziono adresu e-mail użytkownika.",
        } as ProblemDetail,
        500
      );
    }

    // TODO: In production, persist alertsEnabled to database
    // For MVP, we just return the updated config without persisting
    // await supabase.from("company_settings").upsert({ 
    //   company_uuid: userData.company_uuid, 
    //   alerts_enabled: validation.data.alertsEnabled 
    // });

    const updatedConfig: AlertsConfigDTO = {
      alertsEnabled: validation.data.alertsEnabled,
      alertRecipientEmail: userEmail,
    };

    return jsonResponse(updatedConfig, 200);
  } catch (error) {
    console.error("Unexpected error in PATCH /api/settings/alerts:", error);
    return jsonResponse(
      {
        code: "internal_error",
        message: "Wystąpił błąd serwera.",
      } as ProblemDetail,
      500
    );
  }
};


