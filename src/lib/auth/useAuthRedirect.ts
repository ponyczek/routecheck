import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Hook to redirect already authenticated users away from sign-in page
 * Checks session on mount and redirects to dashboard or returnTo URL
 */
export function useAuthRedirect(supabase: SupabaseClient, returnTo?: string, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // User is already authenticated, redirect
          const redirectUrl = returnTo || "/dashboard";
          window.location.href = redirectUrl;
        }
      } catch (error) {
        // Silently fail - user can still use the form
        console.error("Error checking session:", error);
      }
    };

    checkSession();
  }, [supabase, returnTo, enabled]);
}
