import type { APIRoute } from "astro";
import { fetchCurrentUser, createUserErrorResponse } from "@/lib/services/usersService";
import { jsonResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/users/me
 *
 * Fetches the current authenticated user's data.
 *
 * Flow:
 * 1. Verify authentication via Supabase session
 * 2. Fetch user data from database
 * 3. Return UserDTO
 *
 * @param context - Astro API context
 * @returns 200 with UserDTO on success
 * @throws 401 for unauthorized requests (no session or expired token)
 * @throws 404 if user doesn't exist in database
 * @throws 500 for server errors
 */
export const GET: APIRoute = async () => {
  try {
    const user = await fetchCurrentUser();

    return jsonResponse(user, 200);
  } catch (error) {
    const errorResponse = createUserErrorResponse(error);
    return jsonResponse(errorResponse.body, errorResponse.status);
  }
};
