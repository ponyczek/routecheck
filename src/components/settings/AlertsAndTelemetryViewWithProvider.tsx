import { QueryProvider } from "@/lib/query-client";
import { AlertsAndTelemetryView } from "./AlertsAndTelemetryView";
import type { TelemetryAggregatesDTO, EmailLogDTO } from "@/types";

interface AlertsAndTelemetryViewWithProviderProps {
  initialTelemetryData?: TelemetryAggregatesDTO | null;
  initialEmailLogs?: EmailLogDTO[] | null;
}

/**
 * Wrapper komponent dla widoku "Alerty i Telemetria"
 * Zapewnia kontekst TanStack Query (QueryClientProvider)
 * Przekazuje initial data do głównego widoku
 * Ten komponent jest oznaczony jako client:load w Astro
 */
export function AlertsAndTelemetryViewWithProvider({
  initialTelemetryData,
  initialEmailLogs,
}: AlertsAndTelemetryViewWithProviderProps) {
  return (
    <QueryProvider>
      <AlertsAndTelemetryView initialTelemetryData={initialTelemetryData} initialEmailLogs={initialEmailLogs} />
    </QueryProvider>
  );
}
