import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: React.ReactNode;
  /** Optional custom fallback UI */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error: Error | null;
}

/**
 * ErrorBoundary component
 *
 * React Error Boundary that catches errors in the component tree
 * and displays a fallback UI with recovery options.
 *
 * Features:
 * - Catches rendering errors in child components
 * - Displays user-friendly error message
 * - Provides "Refresh" and "Go to Dashboard" actions
 * - Logs errors to console (and optionally to telemetry)
 *
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // TODO: Log to telemetry service if enabled
    // logErrorToTelemetry(error, errorInfo);
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  handleGoToDashboard = (): void => {
    window.location.href = "/dashboard";
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Wystąpił nieoczekiwany błąd</AlertTitle>
              <AlertDescription className="mt-4 flex flex-col gap-4">
                <p className="text-sm">
                  Przepraszamy, coś poszło nie tak. Spróbuj odświeżyć stronę lub wróć do strony głównej.
                </p>

                {/* Show error details in development */}
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="rounded-md bg-muted p-3 text-xs">
                    <summary className="cursor-pointer font-medium">Szczegóły błędu (tylko development)</summary>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                      {"\n\n"}
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-2">
                  <Button onClick={this.handleRefresh} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Odśwież stronę
                  </Button>
                  <Button onClick={this.handleGoToDashboard} variant="default" size="sm" className="gap-2">
                    <Home className="h-4 w-4" />
                    Wróć do Dashboard
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
