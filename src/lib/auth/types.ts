/**
 * Auth types for Sign In flow
 */

export type SignInStatus = "idle" | "submitting" | "success" | "error";

export type SessionExpiryReason = "timeout" | "signed-out" | null;

export type AuthErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "rate_limited"
  | "network"
  | "unknown";

export interface AuthErrorState {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface SignInFormValues {
  email: string;
  password: string;
}

export interface SignInPageProps {
  returnTo?: string;
  expired?: boolean;
}

export interface SignInSuccessPayload {
  redirectTo: string;
}

export interface RedirectMetadata {
  returnTo?: string;
}

