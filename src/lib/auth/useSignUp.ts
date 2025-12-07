import { useMutation } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SignUpFormValues, AuthErrorState, SignUpSuccessPayload } from "./types";

interface UseSignUpOptions {
  supabase: SupabaseClient;
  returnTo?: string;
  onSuccess?: (payload: SignUpSuccessPayload) => void;
  onError?: (error: AuthErrorState) => void;
}

/**
 * Maps Supabase auth errors to AuthErrorState
 */
function mapSupabaseAuthError(error: any): AuthErrorState {
  if (error.message.includes("User already registered")) {
    return {
      code: "email_already_exists",
      message: "Użytkownik z tym adresem e-mail już istnieje. Zaloguj się lub użyj innego adresu.",
    };
  }

  if (error.message.includes("Password")) {
    return {
      code: "weak_password",
      message: "Hasło jest za słabe. Upewnij się, że ma co najmniej 8 znaków.",
    };
  }

  if (error.status === 429 || error.message.includes("rate limit")) {
    return {
      code: "rate_limited",
      message: "Zbyt wiele prób rejestracji. Spróbuj ponownie za kilka minut.",
    };
  }

  return {
    code: "unknown",
    message: "Wystąpił nieoczekiwany błąd",
    details: { originalError: error.message },
  };
}

/**
 * Hook for handling sign-up with Supabase Auth and company creation
 *
 * Process:
 * 1. Register user with Supabase Auth (session stored in localStorage)
 * 2. Create company record in database via API
 * 3. Sync session to cookies (required for server-side middleware)
 * 4. Handle success/error callbacks
 *
 * Uses React Query for state management
 */
export function useSignUp({ supabase, returnTo, onSuccess, onError }: UseSignUpOptions) {
  const mutation = useMutation({
    mutationKey: ["auth", "signup"],
    mutationFn: async (credentials: SignUpFormValues) => {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        throw mapSupabaseAuthError(authError);
      }

      if (!authData.user || !authData.session) {
        throw {
          code: "unknown",
          message: "Nie udało się utworzyć konta",
        } as AuthErrorState;
      }

      // 2. Create company record
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.session.access_token}`,
        },
        body: JSON.stringify({
          name: credentials.companyName,
          userUuid: authData.user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          code: "company_creation_failed",
          message: "Nie udało się utworzyć firmy. Skontaktuj się z wsparciem.",
          details: errorData,
        } as AuthErrorState;
      }

      const company = await response.json();

      // 3. Sync session to cookies for server-side middleware
      // This is crucial: browser stores session in localStorage, but server needs it in cookies
      const syncResponse = await fetch("/api/auth/set-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        }),
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json().catch(() => ({}));
        throw {
          code: "session_sync_failed",
          message: "Nie udało się zsynchronizować sesji. Spróbuj zalogować się ponownie.",
          details: errorData,
        } as AuthErrorState;
      }

      return {
        user: authData.user,
        session: authData.session,
        company,
      };
    },
    onSuccess: (data) => {
      const redirectTo = returnTo || "/dashboard";
      onSuccess?.({
        redirectTo,
        userId: data.user.id,
        companyId: data.company.uuid,
      });
    },
    onError: (error) => {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        onError?.({
          code: "network",
          message: "Błąd połączenia. Sprawdź połączenie internetowe.",
        });
        return;
      }

      // Pass through AuthErrorState from mutation
      if (typeof error === "object" && error !== null && "code" in error) {
        onError?.(error as AuthErrorState);
        return;
      }

      // Unknown error
      onError?.({
        code: "unknown",
        message: "Wystąpił nieoczekiwany błąd",
        details: { error: String(error) },
      });
    },
  });

  return {
    signUp: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as AuthErrorState | null,
    reset: mutation.reset,
  };
}
