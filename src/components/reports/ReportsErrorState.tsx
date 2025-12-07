import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReportsErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Error state for reports list
 * Shows error message with optional retry button
 */
export function ReportsErrorState({ message, onRetry, className }: ReportsErrorStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center min-h-[400px] p-8 text-center", className)}
      role="alert"
      aria-live="assertive"
    >
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-semibold mb-2">Nie udało się załadować raportów</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{message}</p>

      {onRetry && (
        <Button onClick={onRetry} variant="default" className="gap-2">
          <RefreshCw className="size-4" />
          Spróbuj ponownie
        </Button>
      )}
    </div>
  );
}



