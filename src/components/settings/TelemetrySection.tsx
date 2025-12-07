import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TelemetryMetricCard } from "./TelemetryMetricCard";
import { useTelemetryAggregates } from "@/lib/settings";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { TelemetryAggregatesDTO } from "@/types";

interface TelemetrySectionProps {
  initialData?: TelemetryAggregatesDTO | null;
}

/**
 * Sekcja z agregowanymi metrykami telemetrycznymi UX
 * W szczególności mediana czasu wypełnienia formularza kierowcy
 * Zawiera karty metryk (TelemetryMetricCard) i opcjonalny mini wykres
 */
export function TelemetrySection({ initialData }: TelemetrySectionProps) {
  const { data: telemetry, isLoading, error } = useTelemetryAggregates(initialData || undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telemetria UX</CardTitle>
        <CardDescription>
          Metryki jakości doświadczenia użytkownika formularza kierowcy
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nie udało się załadować danych telemetrycznych. Spróbuj ponownie później.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && telemetry && (
          <>
            {telemetry.totalFormSubmissions === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  Brak danych telemetrycznych. Dane pojawią się po pierwszych raportach kierowców.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <TelemetryMetricCard
                  label="Mediana czasu wypełnienia"
                  value={telemetry.medianFormDurationSeconds}
                  unit="s"
                  trend={
                    telemetry.trend
                      ? {
                          direction:
                            telemetry.trend.medianDurationChange < 0 ? "down" : "up",
                          value: `${Math.abs(telemetry.trend.medianDurationChange)}s`,
                        }
                      : undefined
                  }
                />
                <TelemetryMetricCard
                  label="Łączna liczba wypełnień"
                  value={telemetry.totalFormSubmissions}
                />
                <TelemetryMetricCard
                  label="Konwersja linków"
                  value={`${Math.round(telemetry.conversionRate * 100)}%`}
                  trend={
                    telemetry.trend
                      ? {
                          direction:
                            telemetry.trend.conversionRateChange > 0 ? "up" : "down",
                          value: `${Math.abs(Math.round(telemetry.trend.conversionRateChange * 100))}%`,
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

