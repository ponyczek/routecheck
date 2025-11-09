import { z } from "zod";

/**
 * Sign in form validation schema
 */
export const signInFormSchema = z.object({
  email: z
    .string()
    .min(1, "Podaj adres e-mail")
    .email("Podaj poprawny adres e-mail")
    .max(150, "Adres e-mail jest za długi"),
  password: z
    .string()
    .min(6, "Hasło musi mieć min. 6 znaków")
    .max(128, "Hasło jest za długie"),
});

/**
 * Validates and sanitizes returnTo parameter
 * Only allows internal paths (starting with /)
 */
export function validateReturnTo(returnTo: string | undefined | null): string {
  if (!returnTo) {
    return "/dashboard";
  }

  // Only allow internal paths
  if (!returnTo.startsWith("/")) {
    return "/dashboard";
  }

  // Prevent protocol injection
  if (returnTo.includes("://")) {
    return "/dashboard";
  }

  return returnTo;
}

/**
 * Parses expired query parameter
 */
export function parseExpiredParam(expired: string | undefined | null): boolean {
  return expired === "true" || expired === "1";
}

