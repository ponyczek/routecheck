import { CheckCircle } from "lucide-react";
import type { SecurityTipsListProps } from "@/lib/settings/types";

/**
 * SecurityTipsList - Lista najlepszych praktyk bezpieczeństwa
 * 
 * Komponent wyświetlający statyczną listę wskazówek dotyczących bezpieczeństwa
 * sesji i zarządzania kontem. Każda wskazówka ma ikonę CheckCircle.
 * 
 * Zawiera porady dotyczące:
 * - Automatycznego wylogowania po braku aktywności
 * - Regularnej zmiany hasła
 * - Używania silnych haseł
 * - Nie udostępniania danych logowania
 * - Monitorowania aktywności konta
 * 
 * @example
 * ```tsx
 * <SecurityTipsList />
 * ```
 */
export function SecurityTipsList(_props: SecurityTipsListProps) {
  const tips = [
    "Sesja wygasa automatycznie po 24 godzinach braku aktywności dla Twojego bezpieczeństwa.",
    "Regularnie zmieniaj hasło do swojego konta, szczególnie jeśli podejrzewasz nieautoryzowany dostęp.",
    "Używaj silnych, unikalnych haseł – połączenia liter, cyfr i znaków specjalnych.",
    "Nigdy nie udostępniaj swoich danych logowania innym osobom.",
    "Wyloguj się zawsze po zakończeniu pracy, szczególnie na współdzielonych komputerach.",
    "Wszystkie logowania i aktywności są zapisywane w logach audytowych dla bezpieczeństwa firmy.",
  ];

  return (
    <ul className="space-y-3">
      {tips.map((tip, index) => (
        <li key={index} className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600 dark:text-green-500 mt-0.5" />
          <span className="text-sm text-muted-foreground leading-relaxed">
            {tip}
          </span>
        </li>
      ))}
    </ul>
  );
}


