/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly PRIVATE_TOKEN_PEPPER: string;
  readonly OPENROUTER_API_KEY: string;
  // Public env vars for client-side access (browser)
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_KEY: string;
  readonly PUBLIC_SHOW_VEHICLES?: string; // Feature flag for vehicles module
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
