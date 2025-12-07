import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UserEmailDisplayProps } from "@/lib/settings/types";

/**
 * UserEmailDisplay - Komponent wyświetlający adres e-mail użytkownika z możliwością kopiowania
 * 
 * Renderuje adres e-mail z przyciskiem kopiowania do schowka. Po kliknięciu:
 * - Kopiuje e-mail do schowka używając Clipboard API
 * - Pokazuje toast notification potwierdzający akcję
 * - Zmienia ikonę Copy na Check na 2 sekundy
 * - Obsługuje błędy (np. brak wsparcia Clipboard API)
 * 
 * @param props - Props komponentu
 * @param props.email - Adres e-mail do wyświetlenia i skopiowania
 * 
 * @example
 * ```tsx
 * <UserEmailDisplay email="user@example.com" />
 * ```
 */
export function UserEmailDisplay({ email }: UserEmailDisplayProps) {
  const [isCopied, setIsCopied] = useState(false);

  /**
   * Obsługuje kopiowanie e-mail do schowka
   */
  const handleCopyEmail = async () => {
    try {
      // Sprawdź czy Clipboard API jest dostępne
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not supported');
      }
      
      await navigator.clipboard.writeText(email);
      
      // Ustaw stan "skopiowano"
      setIsCopied(true);
      
      // Pokaż toast z potwierdzeniem
      toast.success("E-mail skopiowany do schowka", {
        description: email,
      });
      
      // Zresetuj stan ikony po 2 sekundach
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      toast.error("Nie udało się skopiować e-mail", {
        description: "Spróbuj ręcznie zaznaczyć i skopiować adres.",
      });
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-mono text-foreground break-all">
        {email}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopyEmail}
        className="shrink-0"
        aria-label="Kopiuj adres e-mail"
      >
        <div className="relative h-4 w-4">
          <Copy
            className={cn(
              "h-4 w-4 absolute inset-0 transition-all duration-200",
              isCopied ? "scale-0 opacity-0" : "scale-100 opacity-100"
            )}
          />
          <Check
            className={cn(
              "h-4 w-4 absolute inset-0 transition-all duration-200 text-green-600 dark:text-green-500",
              isCopied ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
          />
        </div>
        <span className="sr-only">
          {isCopied ? "Skopiowano" : "Kopiuj adres e-mail"}
        </span>
      </Button>
    </div>
  );
}


