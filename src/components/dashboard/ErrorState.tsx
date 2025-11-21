import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * ErrorState - Displays error message with retry button
 *
 * Features:
 * - Large error icon
 * - Custom title and message
 * - Optional retry button
 * - Centered layout
 * - Accessible error announcement
 *
 * Example usage:
 * ```tsx
 * <ErrorState
 *   title="Nie udało się załadować danych"
 *   message="Wystąpił problem z połączeniem. Spróbuj ponownie."
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function ErrorState({ title = "Wystąpił błąd", message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn("flex items-center justify-center min-h-[400px] p-4", className)}
      role="alert"
      aria-live="assertive"
    >
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center pt-6">
          <div className="rounded-full bg-destructive/10 p-3 mb-4">
            <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          </div>

          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>

          {onRetry && (
            <Button onClick={onRetry} variant="default" className="gap-2">
              <RefreshCw className="size-4" />
              Spróbuj ponownie
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

