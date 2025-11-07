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

const supabaseUrl = getEnvVar("SUPABASE_URL");
const supabaseAnonKey = getEnvVar("SUPABASE_KEY");
const supabaseServiceRoleKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");

// Anonymous client for authenticated routes (uses RLS)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Service role client for public endpoints and admin operations (bypasses RLS)
export const supabaseServiceClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
