import { WifiOff, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface OfflineFallbackProps {
  /** Callback when retry button is clicked */
  onRetry?: () => void;
}

/**
 * OfflineFallback component
 *
 * Displays a prominent banner when the application is offline.
 * Provides information about limited functionality and a retry button.
 *
 * Only shown when network status is offline.
 *
 * @param props - OfflineFallback props
 * @returns Offline banner component
 */
export function OfflineFallback({ onRetry }: OfflineFallbackProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>Brak połączenia z internetem</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-3">
        <p className="text-sm">
          Nie można połączyć się z serwerem. Niektóre funkcje mogą być niedostępne. Sprawdź połączenie i spróbuj ponownie.
        </p>
        {onRetry && (
          <div>
            <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Spróbuj ponownie
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

