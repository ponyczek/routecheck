import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthErrorState } from "@/lib/auth/types";

interface AuthErrorAlertProps {
  error: AuthErrorState | null;
  onRetry?: () => void;
}

export function AuthErrorAlert({ error, onRetry }: AuthErrorAlertProps) {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd logowania</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{error.message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-3">
            Spróbuj ponownie
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

