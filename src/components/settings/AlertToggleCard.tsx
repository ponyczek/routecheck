import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InfoBanner } from "./InfoBanner";
import { InfoRow } from "./InfoRow";

interface AlertToggleCardProps {
  alertsEnabled: boolean;
  recipientEmail: string;
  onToggle: (enabled: boolean) => Promise<void>;
  isPending: boolean;
}

/**
 * Karta z przełącznikiem alertów e-mail o brakujących raportach
 * 
 * @description
 * Komponent UI do zarządzania alertami e-mail o brakujących raportach kierowców.
 * Wyświetla aktualny stan alertów, opis działania, adres docelowy oraz przełącznik (Switch)
 * do włączania/wyłączania alertów.
 * 
 * @features
 * - InfoBanner z informacją o działaniu alertów (24h delay, raz na raport)
 * - InfoRow z adresem e-mail administratora (read-only)
 * - Switch z labelą i statusem (włączone/wyłączone)
 * - Disabled state podczas pending (optimistic update)
 * - Responsywny layout (mobile-first, sm: horizontal)
 * 
 * @param props - Props komponentu
 * @param props.alertsEnabled - Czy alerty są obecnie włączone
 * @param props.recipientEmail - Adres e-mail administratora (info-only)
 * @param props.onToggle - Callback wywoływany przy zmianie stanu (async)
 * @param props.isPending - Czy trwa aktualizacja (disables switch)
 * 
 * @example
 * ```tsx
 * <AlertToggleCard
 *   alertsEnabled={true}
 *   recipientEmail="admin@company.com"
 *   onToggle={async (enabled) => await updateAlerts(enabled)}
 *   isPending={false}
 * />
 * ```
 */
export function AlertToggleCard({
  alertsEnabled,
  recipientEmail,
  onToggle,
  isPending,
}: AlertToggleCardProps) {
  const handleToggle = async (checked: boolean) => {
    await onToggle(checked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerty o brakujących raportach</CardTitle>
        <CardDescription>
          Automatyczne powiadomienia e-mail wysyłane do kierowców
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoBanner
          description="Alert jest wysyłany raz na brakujący raport, 24 godziny od planowanego terminu wypełnienia. Każdy kierowca otrzymuje powiadomienie na swój adres e-mail."
        />

        <InfoRow label="Adres e-mail administratora" value={recipientEmail} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <div className="space-y-0.5">
            <Label htmlFor="alerts-toggle" className="text-base font-medium">
              Włącz alerty
            </Label>
            <p className="text-sm text-muted-foreground">
              {alertsEnabled
                ? "Alerty są obecnie włączone"
                : "Alerty są obecnie wyłączone"}
            </p>
          </div>
          <Switch
            id="alerts-toggle"
            checked={alertsEnabled}
            onCheckedChange={handleToggle}
            disabled={isPending}
            className="self-start sm:self-center"
          />
        </div>
      </CardContent>
    </Card>
  );
}

