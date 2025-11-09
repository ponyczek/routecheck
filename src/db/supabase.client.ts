import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// Export typed client for use in type annotations
export type SupabaseClient = SupabaseClientBase<Database>;

// Get environment variables with validation
function getEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Check if we're running in the browser
const isBrowser = typeof window !== "undefined";

const supabaseUrl = getEnvVar("SUPABASE_URL");
const supabaseAnonKey = getEnvVar("SUPABASE_KEY");

// Only get service role key on the server
const supabaseServiceRoleKey = !isBrowser ? getEnvVar("SUPABASE_SERVICE_ROLE_KEY") : "";

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
