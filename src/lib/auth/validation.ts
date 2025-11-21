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
 * Sign up form validation schema
 */
export const signUpFormSchema = z
  .object({
    companyName: z
      .string()
      .min(1, "Podaj nazwę firmy")
      .min(2, "Nazwa firmy musi mieć co najmniej 2 znaki")
      .max(100, "Nazwa firmy jest za długa (max. 100 znaków)")
      .transform((val) => val.trim()),
    email: z
      .string()
      .min(1, "Podaj adres e-mail")
      .email("Podaj poprawny adres e-mail")
      .max(150, "Adres e-mail jest za długi")
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string()
      .min(1, "Podaj hasło")
      .min(8, "Hasło musi mieć min. 8 znaków")
      .max(128, "Hasło jest za długie (max. 128 znaków)")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Hasło powinno zawierać małe i wielkie litery oraz cyfry"
      ),
    confirmPassword: z.string().min(1, "Potwierdź hasło"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być takie same",
    path: ["confirmPassword"],
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

