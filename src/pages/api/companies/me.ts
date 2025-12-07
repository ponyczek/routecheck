import type { APIRoute } from "astro";
import { jsonResponse } from "@/lib/utils/errors";
import type { CompanyDTO, UpdateCompanyCommand, ProblemDetail } from "@/types";
import { z } from "zod";

// Disable prerendering for this API route
export const prerender = false;

// Zod schema for validating UpdateCompanyCommand
const updateCompanySchema = z.object({
  name: z
    .string()
    .min(2, "Nazwa firmy musi mieć co najmniej 2 znaki")
    .max(100, "Nazwa firmy może mieć maksymalnie 100 znaków")
    .trim()
    .refine((val) => val.length > 0, "Nazwa firmy nie może być pusta"),
});

/**
 * GET /api/companies/me
 *
 * Fetches the current authenticated user's company data.
 *
 * Flow:
 * 1. Verify authentication via Supabase session
 * 2. Fetch user's company_uuid
 * 3. Fetch company data from database
 * 4. Return CompanyDTO
 *
 * @returns 200 with CompanyDTO on success
 * @throws 401 for unauthorized requests (no session or expired token)
 * @throws 404 if company doesn't exist in database
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

    // Fetch user to get company_uuid
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_uuid")
      .eq("uuid", session.user.id)
      .single();

    if (userError) {
      if (userError.code === "PGRST116") {
        return jsonResponse(
          {
            code: "not_found",
            message: "Nie znaleziono danych użytkownika.",
          } as ProblemDetail,
          404
        );
      }
      console.error("User fetch error:", userError);
      return jsonResponse(
        {
          code: "internal_error",
          message: "Wystąpił błąd serwera.",
        } as ProblemDetail,
        500
      );
    }

    // Fetch company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("uuid, name, created_at")
      .eq("uuid", userData.company_uuid)
      .single();

    if (companyError) {
      if (companyError.code === "PGRST116") {
        return jsonResponse(
          {
            code: "not_found",
            message: "Nie znaleziono firmy.",
          } as ProblemDetail,
          404
        );
      }
      console.error("Company fetch error:", companyError);
      return jsonResponse(
        {
          code: "internal_error",
          message: "Wystąpił błąd serwera.",
        } as ProblemDetail,
        500
      );
    }

    // Map to DTO (camelCase)
    const dto: CompanyDTO = {
      uuid: company.uuid,
      name: company.name,
      createdAt: company.created_at,
    };

    return jsonResponse(dto, 200);
  } catch (error) {
    console.error("Unexpected error in GET /api/companies/me:", error);
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
 * PATCH /api/companies/me
 *
 * Updates the current authenticated user's company name.
 *
 * Flow:
 * 1. Verify authentication via Supabase session
 * 2. Validate request body (UpdateCompanyCommand)
 * 3. Fetch user's company_uuid
 * 4. Update company name in database
 * 5. Return updated CompanyDTO
 *
 * @returns 200 with updated CompanyDTO on success
 * @throws 400 for validation errors
 * @throws 401 for unauthorized requests (no session or expired token)
 * @throws 404 if company doesn't exist in database
 * @throws 500 for server errors
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    // Get Supabase client from locals (set by middleware)
    const supabase = locals.supabase;

    // Parse request body
    let body: UpdateCompanyCommand;
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
    const validation = updateCompanySchema.safeParse(body);
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

    // Fetch user to get company_uuid
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_uuid")
      .eq("uuid", session.user.id)
      .single();

    if (userError) {
      if (userError.code === "PGRST116") {
        return jsonResponse(
          {
            code: "not_found",
            message: "Nie znaleziono danych użytkownika.",
          } as ProblemDetail,
          404
        );
      }
      console.error("User fetch error:", userError);
      return jsonResponse(
        {
          code: "internal_error",
          message: "Wystąpił błąd serwera.",
        } as ProblemDetail,
        500
      );
    }

    // Update company
    const { data: updated, error: updateError } = await supabase
      .from("companies")
      .update({ name: validation.data.name })
      .eq("uuid", userData.company_uuid)
      .select("uuid, name, created_at")
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return jsonResponse(
          {
            code: "not_found",
            message: "Nie znaleziono firmy.",
          } as ProblemDetail,
          404
        );
      }
      console.error("Company update error:", updateError);
      return jsonResponse(
        {
          code: "internal_error",
          message: "Nie udało się zaktualizować firmy.",
        } as ProblemDetail,
        500
      );
    }

    // Map to DTO (camelCase)
    const dto: CompanyDTO = {
      uuid: updated.uuid,
      name: updated.name,
      createdAt: updated.created_at,
    };

    return jsonResponse(dto, 200);
  } catch (error) {
    console.error("Unexpected error in PATCH /api/companies/me:", error);
    return jsonResponse(
      {
        code: "internal_error",
        message: "Wystąpił błąd serwera.",
      } as ProblemDetail,
      500
    );
  }
};
