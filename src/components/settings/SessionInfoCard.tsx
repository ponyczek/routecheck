import { ShieldCheck, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionStatusIndicator } from "./SessionStatusIndicator";
import { SessionExpiryWarning } from "./SessionExpiryWarning";
import { formatSessionDate } from "@/lib/settings/sessionTransformers";
import type { SessionInfoCardProps } from "@/lib/settings/types";

/**
 * SessionInfoCard - Karta wyświetlająca informacje o aktualnej sesji użytkownika
 *
 * Komponent prezentuje szczegółowe informacje o sesji:
 * - Status sesji (aktywna/wygasająca/wygasła) z ikoną
 * - Data wygaśnięcia sesji
 * - Data ostatniej aktywności
 * - Ostrzeżenie o automatycznym wygaśnięciu (jeśli status wymaga)
 *
 * Obsługuje stan ładowania poprzez wyświetlanie szkieletów.
 * Warunkowo wyświetla ostrzeżenie o wygasającej sesji.
 *
 * @param props - Props komponentu
 * @param props.session - Dane sesji do wyświetlenia (SessionViewModel)
 * @param props.isLoading - Opcjonalna flaga stanu ładowania
 *
 * @example
 * ```tsx
 * <SessionInfoCard
 *   session={sessionData}
 *   isLoading={false}
 * />
 * ```
 */
export function SessionInfoCard({ session, isLoading = false }: SessionInfoCardProps) {
  // Stan ładowania - wyświetl szkielety
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Informacje o sesji</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  // Formatuj daty dla czytelności
  const formattedExpiresAt = formatSessionDate(session.expiresAt);
  const formattedLastActivity = formatSessionDate(session.lastActivityAt);

  // Pokaż ostrzeżenie tylko dla sesji wygasających lub wygasłych
  const shouldShowWarning = session.status === "expiring_soon" || session.status === "expired";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Informacje o sesji</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status sesji */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <SessionStatusIndicator status={session.status} />
        </div>

        {/* Ostrzeżenie o wygasającej sesji */}
        {shouldShowWarning && (
          <SessionExpiryWarning expiresAt={session.expiresAt} remainingHours={session.remainingHours} />
        )}

        {/* Data wygaśnięcia */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Data wygaśnięcia</span>
          </div>
          <p className="text-sm pl-6">{formattedExpiresAt}</p>
        </div>

        {/* Data ostatniej aktywności */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Ostatnia aktywność</span>
          </div>
          <p className="text-sm pl-6">{formattedLastActivity}</p>
        </div>

        {/* Informacja dodatkowa */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Sesja jest ważna przez 24 godziny od ostatniej aktywności. Po wygaśnięciu zostaniesz automatycznie
            wylogowany.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
