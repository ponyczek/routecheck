import type { CompanyDTO, ProblemDetail, UpdateCompanyCommand } from "@/types";
import { supabaseBrowserClient } from "@/db/supabase.client";
import { z } from "zod";

/**
 * Zod schema for validating CompanyDTO from API
 */
const CompanyDTOSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string(), // ISO 8601 string from Supabase
});

/**
 * Zod schema for validating UpdateCompanyCommand
 */
export const updateCompanySchema = z.object({
  name: z
    .string()
    .min(2, "Nazwa firmy musi mieć co najmniej 2 znaki")
    .max(100, "Nazwa firmy może mieć maksymalnie 100 znaków")
    .trim()
    .refine((val) => val.length > 0, "Nazwa firmy nie może być pusta"),
});

/**
 * Fetches the current user's company from the database
 * @throws {Error} UNAUTHORIZED if no session or session error
 * @throws {Error} NOT_FOUND if company doesn't exist in database
 * @returns {Promise<CompanyDTO>} Current company data
 */
export async function fetchCurrentCompany(): Promise<CompanyDTO> {
  // Get current session
  const {
    data: { session },
    error: sessionError,
  } = await supabaseBrowserClient.auth.getSession();

  if (sessionError || !session) {
    throw new Error("UNAUTHORIZED");
  }

  // Fetch user to get company_uuid
  const { data: userData, error: userError } = await supabaseBrowserClient
    .from("users")
    .select("company_uuid")
    .eq("uuid", session.user.id)
    .single();

  if (userError) {
    if (userError.code === "PGRST116") {
      throw new Error("NOT_FOUND");
    }
    throw userError;
  }

  // Fetch company
  const { data, error } = await supabaseBrowserClient
    .from("companies")
    .select("uuid, name, created_at")
    .eq("uuid", userData.company_uuid)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("NOT_FOUND");
    }
    throw error;
  }

  // Validate and transform response
  const validated = CompanyDTOSchema.parse({
    uuid: data.uuid,
    name: data.name,
    createdAt: data.created_at,
  });

  return validated;
}

/**
 * Updates the current user's company name
 * @param command - Update command with new company name
 * @throws {Error} UNAUTHORIZED if no session or session error
 * @throws {Error} NOT_FOUND if company doesn't exist in database
 * @throws {Error} VALIDATION_ERROR if data validation fails
 * @returns {Promise<CompanyDTO>} Updated company data
 */
export async function updateCurrentCompany(command: UpdateCompanyCommand): Promise<CompanyDTO> {
  // Validate input
  const validation = updateCompanySchema.safeParse(command);
  if (!validation.success) {
    const error: Error & { details?: unknown } = new Error("VALIDATION_ERROR");
    error.details = validation.error.flatten().fieldErrors;
    throw error;
  }

  // Get current session
  const {
    data: { session },
    error: sessionError,
  } = await supabaseBrowserClient.auth.getSession();

  if (sessionError || !session) {
    throw new Error("UNAUTHORIZED");
  }

  // Fetch user to get company_uuid
  const { data: userData, error: userError } = await supabaseBrowserClient
    .from("users")
    .select("company_uuid")
    .eq("uuid", session.user.id)
    .single();

  if (userError) {
    if (userError.code === "PGRST116") {
      throw new Error("NOT_FOUND");
    }
    throw userError;
  }

  // Update company
  const { data, error } = await supabaseBrowserClient
    .from("companies")
    .update({ name: validation.data.name })
    .eq("uuid", userData.company_uuid)
    .select("uuid, name, created_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("NOT_FOUND");
    }
    throw error;
  }

  // Validate and transform response
  const validated = CompanyDTOSchema.parse({
    uuid: data.uuid,
    name: data.name,
    createdAt: data.created_at,
  });

  return validated;
}

/**
 * Error response for API endpoints
 */
export function createCompanyErrorResponse(error: unknown): {
  status: number;
  body: ProblemDetail;
} {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return {
        status: 401,
        body: {
          code: "unauthorized",
          message: "Sesja wygasła. Zaloguj się ponownie.",
        },
      };
    }

    if (error.message === "NOT_FOUND") {
      return {
        status: 404,
        body: {
          code: "not_found",
          message: "Firma nie istnieje.",
        },
      };
    }

    if (error.message === "VALIDATION_ERROR") {
      return {
        status: 400,
        body: {
          code: "validation_error",
          message: "Błąd walidacji danych.",
          details: (error as Error & { details?: unknown }).details || {},
        },
      };
    }
  }

  return {
    status: 500,
    body: {
      code: "internal_error",
      message: "Wystąpił błąd serwera.",
    },
  };
}
