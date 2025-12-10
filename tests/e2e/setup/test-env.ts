/**
 * Test environment configuration
 *
 * This file provides environment variables for E2E tests.
 * Uses dotenv to load from .env.test file
 *
 * IMPORTANT: Environment variables are loaded ONLY in the test context,
 * they do NOT leak to the application code.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.test - this runs in each worker process
// Use override: false to not overwrite existing env vars (safer)
// But since test workers are isolated, this should work
const result = dotenv.config({
  path: path.resolve(__dirname, "../../../.env.test"),
  override: true, // Force reload in each worker
});

// Debug: log if loading failed
if (result.error) {
  console.error("Failed to load .env.test:", result.error);
}

export const testConfig = {
  // Test user credentials (from .env.test)
  testEmail: process.env.E2E_USERNAME || "",
  testPassword: process.env.E2E_PASSWORD || "",

  // Supabase config (from .env.test)
  supabaseUrl: process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_KEY || process.env.PUBLIC_SUPABASE_KEY || "",

  // Base URL
  baseUrl: process.env.BASE_URL || "http://127.0.0.1:4321",
};

/**
 * Validate that required environment variables are set
 */
export function validateTestEnv() {
  const required = [
    { key: "E2E_USERNAME", value: process.env.E2E_USERNAME },
    { key: "E2E_PASSWORD", value: process.env.E2E_PASSWORD },
    { key: "SUPABASE_URL", value: process.env.SUPABASE_URL },
    { key: "SUPABASE_KEY", value: process.env.SUPABASE_KEY },
  ];

  const missing = required.filter((item) => !item.value).map((item) => item.key);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables in .env.test:\n\n` +
        `  ${missing.join("\n  ")}\n\n` +
        `Please ensure .env.test file exists in the project root with all required variables.\n` +
        `Expected variables: E2E_USERNAME, E2E_PASSWORD, SUPABASE_URL, SUPABASE_KEY`
    );
  }
}

/**
 * Generate unique test data to avoid conflicts
 */
export function generateTestData() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    timestamp,
    random,
    driver: {
      name: `E2E Test Driver ${timestamp}`,
      email: `driver-${timestamp}-${random}@e2e-test.routecheck.app`,
      timezone: "Europe/Warsaw",
    },
    vehicle: {
      plate: `E2E${random.toUpperCase()}`,
      vin: `TEST${timestamp}${random}`.substring(0, 17).toUpperCase(),
      make: "Test Make",
      model: "Test Model",
      year: new Date().getFullYear(),
    },
  };
}
