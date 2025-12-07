import { AlertToggleCard } from "./AlertToggleCard";
import { useAlertsConfig, useUpdateAlertsConfig } from "@/lib/settings";

/**
 * Sekcja zarządzania konfiguracją alertów 24h
 * 
 * @description
 * Komponent odpowiedzialny za wyświetlanie i zarządzanie konfiguracją alertów e-mail.
 * Wykorzystuje TanStack Query hooks do pobierania i aktualizacji stanu alertów
 * z optimistic updates dla lepszego UX.
 * 
 * @features
 * - Pobiera konfigurację alertów z API (GET /api/settings/alerts)
 * - Aktualizuje konfigurację z optimistic update (PATCH /api/settings/alerts)
 * - Wyświetla loading skeleton podczas ładowania
 * - Deleguje rendering do AlertToggleCard
 * 
 * @example
 * ```tsx
 * <AlertsConfigSection />
 * ```
 */
export function AlertsConfigSection() {
  const { data: config, isLoading } = useAlertsConfig();
  const updateMutation = useUpdateAlertsConfig();

  const handleToggle = async (enabled: boolean) => {
    await updateMutation.mutateAsync({ alertsEnabled: enabled });
  };

  if (isLoading || !config) {
    return (
      <div className="animate-pulse">
        <div className="h-[200px] bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <AlertToggleCard
      alertsEnabled={config.alertsEnabled}
      recipientEmail={config.alertRecipientEmail}
      onToggle={handleToggle}
      isPending={updateMutation.isPending}
    />
  );
}

