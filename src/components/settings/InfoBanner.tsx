import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InfoBannerProps {
  title?: string;
  description: string;
  variant?: "default" | "destructive";
}

/**
 * Komponent baneru informacyjnego
 * Wyświetla komunikat z ikoną (info circle) i tekstem
 * Używany do prezentacji ważnych informacji użytkownikowi
 */
export function InfoBanner({ title, description, variant = "default" }: InfoBannerProps) {
  return (
    <Alert variant={variant}>
      <Info className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}


