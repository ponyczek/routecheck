import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "./SignUpForm";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { SignUpFooterLinks } from "./SignUpFooterLinks";
import { QueryProvider } from "@/lib/query-client";
import type { AuthErrorState, SignUpSuccessPayload } from "@/lib/auth/types";

interface SignUpFormCardProps {
  returnTo?: string;
  supabaseUrl: string;
  supabaseKey: string;
}

/**
 * Sign up form card container
 * 
 * Responsibilities:
 * - Manages auth error state
 * - Provides QueryProvider for React Query
 * - Handles success/error callbacks from SignUpForm
 * - Redirects user on successful sign up
 */
export function SignUpFormCard({ returnTo, supabaseUrl, supabaseKey }: SignUpFormCardProps) {
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);

  const handleSuccess = (result: SignUpSuccessPayload) => {
    // Clear any errors
    setAuthError(null);

    // Redirect to the target page
    window.location.href = result.redirectTo;
  };

  const handleError = (error: AuthErrorState) => {
    setAuthError(error);

    // Log error for debugging (could be sent to telemetry)
    console.error("Sign up error:", error);
  };

  const handleRetry = () => {
    setAuthError(null);
  }

  return (
    <QueryProvider>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Utwórz konto</CardTitle>
          <CardDescription className="text-center">
            Załóż konto firmowe, aby rozpocząć pracę z RouteCheck
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthErrorAlert error={authError} onRetry={handleRetry} />
          <SignUpForm
            returnTo={returnTo}
            onSuccess={handleSuccess}
            onError={handleError}
            supabaseUrl={supabaseUrl}
            supabaseKey={supabaseKey}
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <SignUpFooterLinks supportEmail="support@routecheck.app" returnTo={returnTo} />
        </CardFooter>
      </Card>
    </QueryProvider>
  );
}


