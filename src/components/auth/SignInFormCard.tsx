import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "./SignInForm";
import { SessionExpiryNotice } from "./SessionExpiryNotice";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { SignInFooterLinks } from "./SignInFooterLinks";
import { QueryProvider } from "@/lib/query-client";
import type { SessionExpiryReason, AuthErrorState, SignInSuccessPayload } from "@/lib/auth/types";

interface SignInFormCardProps {
  returnTo?: string;
  sessionExpiryReason?: SessionExpiryReason;
  supabaseUrl: string;
  supabaseKey: string;
}

export function SignInFormCard({ returnTo, sessionExpiryReason, supabaseUrl, supabaseKey }: SignInFormCardProps) {
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);

  const handleSuccess = (result: SignInSuccessPayload) => {
    // Clear any errors
    setAuthError(null);
    
    // Redirect to the target page
    window.location.href = result.redirectTo;
  };

  const handleError = (error: AuthErrorState) => {
    setAuthError(error);
    
    // Log error for debugging (could be sent to telemetry)
    console.error("Sign in error:", error);
  };

  const handleRetry = () => {
    setAuthError(null);
  };

  return (
    <QueryProvider>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Zaloguj się</CardTitle>
          <CardDescription className="text-center">
            Wprowadź swoje dane, aby uzyskać dostęp do panelu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SessionExpiryNotice reason={sessionExpiryReason || null} />
          <AuthErrorAlert error={authError} onRetry={handleRetry} />
          <SignInForm 
            returnTo={returnTo} 
            onSuccess={handleSuccess} 
            onError={handleError}
            supabaseUrl={supabaseUrl}
            supabaseKey={supabaseKey}
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <SignInFooterLinks supportEmail="support@routecheck.app" />
        </CardFooter>
      </Card>
    </QueryProvider>
  );
}

