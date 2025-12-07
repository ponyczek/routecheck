import type { UserDTO, ProblemDetail } from "@/types";
import { supabaseBrowserClient } from "@/db/supabase.client";
import { z } from "zod";

/**
 * Zod schema for validating UserDTO from API
 */
const UserDTOSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  createdAt: z.string(), // ISO 8601 string from Supabase
});

/**
 * Fetches the current authenticated user from the database
 * @throws {Error} UNAUTHORIZED if no session or session error
 * @throws {Error} NOT_FOUND if user doesn't exist in database
 * @returns {Promise<UserDTO>} Current user data
 */
export async function fetchCurrentUser(): Promise<UserDTO> {
  // Get current session
  const {
    data: { session },
    error: sessionError,
  } = await supabaseBrowserClient.auth.getSession();

  if (sessionError || !session) {
    throw new Error("UNAUTHORIZED");
  }

  // Fetch user from database
  const { data, error } = await supabaseBrowserClient
    .from("users")
    .select("uuid, company_uuid, created_at")
    .eq("uuid", session.user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("NOT_FOUND");
    }
    throw error;
  }

  // Validate and transform response
  const validated = UserDTOSchema.parse({
    uuid: data.uuid,
    companyUuid: data.company_uuid,
    createdAt: data.created_at,
  });

  return validated;
}

/**
 * Error response for API endpoints
 */
export function createUserErrorResponse(error: unknown): {
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
          message: "Użytkownik nie istnieje.",
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
