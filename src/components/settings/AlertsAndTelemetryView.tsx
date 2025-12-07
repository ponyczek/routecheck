import { PageHeader } from "./PageHeader";
import { AlertsConfigSection } from "./AlertsConfigSection";
import { EmailLogsSection } from "./EmailLogsSection";
import { TelemetrySection } from "./TelemetrySection";
import type { TelemetryAggregatesDTO, EmailLogDTO } from "@/types";

interface AlertsAndTelemetryViewProps {
  initialTelemetryData?: TelemetryAggregatesDTO | null;
  initialEmailLogs?: EmailLogDTO[] | null;
}

/**
 * Główny widok "Alerty i Telemetria"
 *
 * @description
 * Ten widok pozwala spedytorom:
 * - Zarządzać konfiguracją alertów e-mail o brakujących raportach (US-014)
 * - Przeglądać historię wysłanych alertów e-mail
 * - Monitorować metryki telemetryczne UX formularza kierowcy (US-017)
 *
 * Widok składa się z trzech głównych sekcji:
 * 1. Konfiguracja alertów - toggle włączania/wyłączania powiadomień
 * 2. Historia e-mail - ostatnie 10 wysłanych alertów
 * 3. Telemetria UX - agregowane metryki (mediana czasu, konwersja, etc.)
 *
 * @param props - Props komponentu
 * @param props.initialTelemetryData - Initial data dla metryk telemetrycznych (z SSR)
 * @param props.initialEmailLogs - Initial data dla logów e-mail (z SSR)
 *
 * @example
 * ```tsx
 * <AlertsAndTelemetryView
 *   initialTelemetryData={telemetryData}
 *   initialEmailLogs={emailLogs}
 * />
 * ```
 */
export function AlertsAndTelemetryView({ initialTelemetryData, initialEmailLogs }: AlertsAndTelemetryViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerty i telemetria"
        description="Zarządzaj powiadomieniami e-mail i przeglądaj metryki użyteczności formularza kierowcy"
      />

      <div className="space-y-6">
        <AlertsConfigSection />
        <EmailLogsSection initialLogs={initialEmailLogs} />
        <TelemetrySection initialData={initialTelemetryData} />
      </div>
    </div>
  );
}
