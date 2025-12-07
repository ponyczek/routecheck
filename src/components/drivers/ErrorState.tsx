import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

/**
 * Komponent wyświetlający komunikat błędu z przyciskiem ponowienia
 * Używany gdy nie udało się załadować listy kierowców
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Alert variant="destructive" className="mb-6 max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Nie udało się załadować kierowców</AlertTitle>
        <AlertDescription>
          {error.message || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie za chwilę."}
        </AlertDescription>
      </Alert>
      <Button onClick={onRetry} variant="outline" size="lg">
        <RefreshCw className="mr-2 h-4 w-4" />
        Spróbuj ponownie
      </Button>
    </div>
  );
}
