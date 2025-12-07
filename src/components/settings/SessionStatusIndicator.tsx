import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSessionStatusText, getSessionStatusVariant } from "@/lib/settings/sessionTransformers";
import type { SessionStatusIndicatorProps } from "@/lib/settings/types";

/**
 * SessionStatusIndicator - Komponent wyświetlający wizualny wskaźnik statusu sesji
 *
 * Renderuje badge z odpowiednią kolorystyką i ikoną w zależności od statusu sesji:
 * - active: zielony badge z ikoną check
 * - expiring_soon: żółty/pomarańczowy badge z ikoną check
 * - expired: czerwony badge z ikoną X
 *
 * @param props - Props komponentu
 * @param props.status - Status sesji ('active' | 'expiring_soon' | 'expired')
 * @param props.className - Opcjonalne dodatkowe klasy CSS
 *
 * @example
 * ```tsx
 * <SessionStatusIndicator status="active" />
 * <SessionStatusIndicator status="expiring_soon" className="mt-4" />
 * ```
 */
export function SessionStatusIndicator({ status, className }: SessionStatusIndicatorProps) {
  const variant = getSessionStatusVariant(status);
  const text = getSessionStatusText(status);

  // Wybierz odpowiednią ikonę w zależności od statusu
  const Icon = status === "expired" ? X : Check;

  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      <span>{text}</span>
    </Badge>
  );
}
