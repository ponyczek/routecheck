import { Info, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SecurityTipsList } from "./SecurityTipsList";
import type { SecurityTipsCardProps } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

/**
 * SecurityTipsCard - Karta z poradami bezpieczeństwa i informacjami o logach audytowych
 *
 * Komponent edukuje użytkownika o najlepszych praktykach bezpieczeństwa
 * związanych z zarządzaniem sesją i kontem. Zawiera:
 * - Listę wskazówek bezpieczeństwa (SecurityTipsList)
 * - Informację o logach audytowych
 * - Kontekst firmy użytkownika
 * - Opcjonalnie link do dokumentacji bezpieczeństwa
 *
 * @param props - Props komponentu
 * @param props.companyName - Nazwa firmy użytkownika dla kontekstu komunikatów
 * @param props.className - Opcjonalne dodatkowe klasy CSS
 *
 * @example
 * ```tsx
 * <SecurityTipsCard companyName="Moja Firma Sp. z o.o." />
 * ```
 */
export function SecurityTipsCard({ companyName, className }: SecurityTipsCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Bezpieczeństwo i najlepsze praktyki</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lista wskazówek bezpieczeństwa */}
        <div className="space-y-3">
          <SecurityTipsList />
        </div>

        {/* Informacja o logach audytowych */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <Shield className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Logi audytowe</h4>
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                Wszystkie logowania, wylogowania i istotne działania w systemie są rejestrowane w logach audytowych
                firmy <strong>{companyName}</strong>. Dzięki temu administrator może monitorować bezpieczeństwo kont i
                wykrywać potencjalne problemy.
              </p>
            </div>
          </div>
        </div>

        {/* Dodatkowa informacja */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            W przypadku podejrzenia naruszenia bezpieczeństwa konta, natychmiast skontaktuj się z administratorem
            systemu.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
