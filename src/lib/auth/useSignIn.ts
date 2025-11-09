import { useMutation } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SignInFormValues, AuthErrorState } from "./types";

interface UseSignInOptions {
  supabase: SupabaseClient;
  returnTo?: string;
  onSuccess?: (redirectTo: string) => void;
  onError?: (error: AuthErrorState) => void;
}

/**
 * Hook for handling sign-in with Supabase Auth
 * Uses React Query for state management
 */
export function useSignIn({ supabase, returnTo, onSuccess, onError }: UseSignInOptions) {
  const mutation = useMutation({
    mutationKey: ["auth", "signin"],
    mutationFn: async (credentials: SignInFormValues) => {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        // Map Supabase errors to AuthErrorState
        let errorState: AuthErrorState;

        if (authError.message.includes("Invalid login credentials")) {
          errorState = {
            code: "invalid_credentials",
            message: "Nieprawidłowy email lub hasło. Sprawdź swoje dane i spróbuj ponownie.",
          };
        } else if (authError.message.includes("Email not confirmed")) {
          errorState = {
            code: "email_not_confirmed",
            message: "Twój email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową.",
          };
        } else if (authError.message.includes("rate limit") || authError.status === 429) {
          errorState = {
            code: "rate_limited",
            message: "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.",
          };
        } else {
          errorState = {
            code: "unknown",
            message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
            details: { originalError: authError.message },
          };
        }

        throw errorState;
      }

      if (!authData.session) {
        const errorState: AuthErrorState = {
          code: "unknown",
          message: "Nie udało się utworzyć sesji. Spróbuj ponownie.",
        };
        throw errorState;
      }

      return authData;
    },
    onSuccess: (data, variables) => {
      // Session is automatically persisted by Supabase client
      // Could optionally prefetch user data here
      const redirectTo = returnTo || "/dashboard";
      onSuccess?.(redirectTo);
    },
    onError: (error) => {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkError: AuthErrorState = {
          code: "network",
          message: "Błąd połączenia. Sprawdź swoje połączenie internetowe i spróbuj ponownie.",
        };
        onError?.(networkError);
        return;
      }

      // Pass through AuthErrorState from mutation
      if (typeof error === "object" && error !== null && "code" in error) {
        onError?.(error as AuthErrorState);
        return;
      }

      // Unknown error
      const unknownError: AuthErrorState = {
        code: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
        details: { error: String(error) },
      };
      onError?.(unknownError);
    },
  });

  return {
    signIn: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as AuthErrorState | null,
    reset: mutation.reset,
  };
}

