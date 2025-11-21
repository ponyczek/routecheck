import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";

import type { Database } from "./database.types";

// Export typed client for use in type annotations
export type SupabaseClient = SupabaseClientBase<Database>;

// Check if we're running in the browser
const isBrowser = typeof window !== "undefined";

// Get environment variables with fallback
// In Astro, PUBLIC_ prefixed vars are available in browser, non-prefixed only on server
function getSupabaseUrl(): string {
  if (isBrowser) {
    // Browser: use PUBLIC_ prefixed var
    return import.meta.env.PUBLIC_SUPABASE_URL || "";
  }
  // Server: try non-prefixed first, then PUBLIC_ as fallback
  return import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || "";
}

function getSupabaseAnonKey(): string {
  if (isBrowser) {
    // Browser: use PUBLIC_ prefixed var
    return import.meta.env.PUBLIC_SUPABASE_KEY || "";
  }
  // Server: try non-prefixed first, then PUBLIC_ as fallback
  return import.meta.env.SUPABASE_KEY || import.meta.env.PUBLIC_SUPABASE_KEY || "";
}

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

// Validate that we have the required variables
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) {
    missing.push(isBrowser ? "PUBLIC_SUPABASE_URL" : "SUPABASE_URL or PUBLIC_SUPABASE_URL");
  }
  if (!supabaseAnonKey) {
    missing.push(isBrowser ? "PUBLIC_SUPABASE_KEY" : "SUPABASE_KEY or PUBLIC_SUPABASE_KEY");
  }
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}.\n` +
    `Please add them to your .env file.\n` +
    `For client-side access, use PUBLIC_ prefix (e.g., PUBLIC_SUPABASE_URL).`
  );
}

// Only get service role key on the server
const supabaseServiceRoleKey = !isBrowser ? (import.meta.env.SUPABASE_SERVICE_ROLE_KEY || "") : "";

// Anonymous client for authenticated routes (uses RLS)
// This client works in both server and browser contexts
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Enable session persistence in browser
    autoRefreshToken: true, // Auto-refresh tokens
    detectSessionInUrl: true, // Detect session from URL (for OAuth flows)
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

// Browser-specific client (same as above, for clarity)
export const supabaseBrowserClient = supabaseClient;

// Service role client for public endpoints and admin operations (bypasses RLS)
// Only create this on the server
export const supabaseServiceClient = !isBrowser
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : (null as unknown as SupabaseClient); // Placeholder for browser (should never be used)

/**
 * Create a Supabase client for server-side use with Astro cookies
 * This client can read/write session from/to cookies
 * 
 * @param cookies - Astro cookies object from context
 * @returns Supabase client with cookie-based session storage
 */
export function createServerSupabaseClient(cookies: AstroCookies): SupabaseClient {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          return cookies.get(key)?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          cookies.set(key, value, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            sameSite: "lax",
            secure: import.meta.env.PROD, // Only secure in production (HTTPS)
          });
        },
        removeItem: (key: string) => {
          cookies.delete(key, {
            path: "/",
          });
        },
      },
    },
  });
}
