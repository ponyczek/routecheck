import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatSessionDate } from "@/lib/settings/sessionTransformers";
import type { SessionExpiryWarningProps } from "@/lib/settings/types";

/**
 * SessionExpiryWarning - Komponent wyświetlający ostrzeżenie o automatycznym wygaśnięciu sesji
 * 
 * Pokazuje alert informujący użytkownika o tym, że sesja wygaśnie po 24h braku aktywności.
 * Wyświetla sformatowaną datę i czas wygaśnięcia oraz pozostały czas w godzinach.
 * 
 * Używa komponentu Alert z Shadcn/ui z ikoną ostrzeżenia.
 * 
 * @param props - Props komponentu
 * @param props.expiresAt - Data wygaśnięcia sesji w formacie ISO 8601
 * @param props.remainingHours - Opcjonalnie obliczone pozostałe godziny do wygaśnięcia
 * 
 * @example
 * ```tsx
 * <SessionExpiryWarning 
 *   expiresAt="2025-11-25T14:30:00Z" 
 *   remainingHours={1} 
 * />
 * ```
 */
export function SessionExpiryWarning({ expiresAt, remainingHours }: SessionExpiryWarningProps) {
  const formattedDate = formatSessionDate(expiresAt);
  
  return (
    <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        Automatyczne wygaśnięcie sesji
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        Twoja sesja wygaśnie automatycznie po 24 godzinach braku aktywności.
        {remainingHours !== undefined && (
          <>
            {' '}
            <strong>
              {remainingHours === 0 
                ? 'Sesja wygasła.' 
                : `Pozostało: ${remainingHours} ${remainingHours === 1 ? 'godzina' : 'godzin'}.`}
            </strong>
          </>
        )}
        <div className="mt-1 text-sm">
          Data wygaśnięcia: {formattedDate}
        </div>
      </AlertDescription>
    </Alert>
  );
}


