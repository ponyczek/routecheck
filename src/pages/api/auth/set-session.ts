import type { APIRoute } from "astro";
import { createServerSupabaseClient } from "@/db/supabase.client";
import { z } from "zod";

/**
 * API endpoint to sync session from browser localStorage to server cookies
 *
 * This is needed because:
 * 1. Browser Supabase client stores session in localStorage
 * 2. Server middleware checks session in cookies
 * 3. After signup, session exists in localStorage but not in cookies
 * 4. This endpoint bridges that gap by setting the session in cookies
 *
 * Usage:
 * POST /api/auth/set-session
 * Body: { access_token, refresh_token }
 */

const SetSessionSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { access_token, refresh_token } = SetSessionSchema.parse(body);

    // Create server-side Supabase client with cookie storage
    const supabase = createServerSupabaseClient(cookies);

    // Set session in cookies by calling setSession
    // This will store the session in cookies via our custom storage adapter
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error("Failed to set session:", error);
      return new Response(
        JSON.stringify({
          code: "session_error",
          message: "Nie udało się ustawić sesji",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!data.session) {
      return new Response(
        JSON.stringify({
          code: "session_error",
          message: "Nie udało się ustawić sesji",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Success - session is now stored in cookies
    return new Response(
      JSON.stringify({
        success: true,
        message: "Sesja ustawiona pomyślnie",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in set-session endpoint:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          code: "validation_error",
          message: "Nieprawidłowe dane",
          details: error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({
        code: "internal_error",
        message: "Wystąpił błąd serwera",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const prerender = false;
