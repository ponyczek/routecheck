/**
 * Auth types for Sign In and Sign Up flows
 */

export type SignInStatus = "idle" | "submitting" | "success" | "error";

export type SessionExpiryReason = "timeout" | "signed-out" | null;

export type AuthErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_already_exists"
  | "weak_password"
  | "company_creation_failed"
  | "rate_limited"
  | "network"
  | "unknown";

export interface AuthErrorState {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Sign In types
 */
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

/**
 * Sign Up types
 */
export interface SignUpFormValues {
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignUpSuccessPayload {
  redirectTo: string;
  userId: string;
  companyId: string;
}

/**
 * Password strength levels
 */
export type PasswordStrength = "weak" | "medium" | "strong";

/**
 * Redirect metadata
 */
export interface RedirectMetadata {
  returnTo?: string;
}

