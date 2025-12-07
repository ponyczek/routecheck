import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CompanyDTO,
  UpdateCompanyCommand,
  AlertsConfigDTO,
  UpdateAlertsConfigCommand,
  TelemetryAggregatesDTO,
  EmailLogDTO,
  EmailLogsListResponseDTO,
} from "@/types";

// Query key factory
export const companyKeys = {
  all: ["companies"] as const,
  me: () => [...companyKeys.all, "me"] as const,
};

export const alertsKeys = {
  all: ["alerts-config"] as const,
  config: () => [...alertsKeys.all, "config"] as const,
};

export const telemetryKeys = {
  all: ["telemetry"] as const,
  aggregates: (params: { from: string; to: string; eventType?: string }) =>
    [...telemetryKeys.all, "aggregates", params] as const,
};

export const emailLogsKeys = {
  all: ["email-logs"] as const,
  list: (params: { limit: number; sortBy: string; sortDir: string }) =>
    [...emailLogsKeys.all, "list", params] as const,
};

/**
 * Hook do pobierania danych firmy zalogowanego użytkownika
 * @param initialData - Optional initial data from SSR
 */
export function useCompany(initialData?: CompanyDTO) {
  return useQuery({
    queryKey: companyKeys.me(),
    queryFn: async () => {
      const response = await fetch("/api/companies/me", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json() as Promise<CompanyDTO>;
    },
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minut
  });
}

/**
 * Hook do aktualizacji nazwy firmy
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: UpdateCompanyCommand) => {
      const response = await fetch("/api/companies/me", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json() as Promise<CompanyDTO>;
    },
    onSuccess: (updatedCompany) => {
      // Aktualizacja cache
      queryClient.setQueryData(companyKeys.me(), updatedCompany);

      // Opcjonalnie invalidate dla pewności
      queryClient.invalidateQueries({ queryKey: companyKeys.me() });
    },
  });
}

/**
 * Hook do pobierania konfiguracji alertów
 * @param initialData - Optional initial data from SSR
 */
export function useAlertsConfig(initialData?: AlertsConfigDTO) {
  return useQuery({
    queryKey: alertsKeys.config(),
    queryFn: async () => {
      const response = await fetch("/api/settings/alerts", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json() as Promise<AlertsConfigDTO>;
    },
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minut
  });
}

/**
 * Hook do aktualizacji konfiguracji alertów
 * Wykorzystuje optimistic update dla lepszego UX
 */
export function useUpdateAlertsConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: UpdateAlertsConfigCommand) => {
      const response = await fetch("/api/settings/alerts", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json() as Promise<AlertsConfigDTO>;
    },
    onMutate: async (newConfig) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: alertsKeys.config() });

      // Snapshot previous value
      const previous = queryClient.getQueryData<AlertsConfigDTO>(alertsKeys.config());

      // Optimistically update to new value
      if (previous) {
        queryClient.setQueryData<AlertsConfigDTO>(alertsKeys.config(), {
          ...previous,
          alertsEnabled: newConfig.alertsEnabled,
        });
      }

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback to previous value
      if (context?.previous) {
        queryClient.setQueryData(alertsKeys.config(), context.previous);
      }

      toast.error("Nie udało się zaktualizować ustawień alertów", {
        description: err instanceof Error ? err.message : "Wystąpił błąd",
      });
    },
    onSuccess: () => {
      toast.success("Ustawienia alertów zaktualizowane");
    },
    onSettled: () => {
      // Invalidate to ensure we have fresh data
      queryClient.invalidateQueries({ queryKey: alertsKeys.config() });
    },
  });
}

/**
 * Hook do pobierania zagregowanych metryk telemetrycznych
 * @param initialData - Optional initial data from SSR
 */
export function useTelemetryAggregates(initialData?: TelemetryAggregatesDTO) {
  // Calculate date range: last 7 days
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);

  const params = {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
    eventType: "FORM_SUBMIT",
  };

  return useQuery({
    queryKey: telemetryKeys.aggregates(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        eventType: params.eventType,
        bucket: "day",
        from: params.from,
        to: params.to,
      });

      const response = await fetch(`/api/telemetry?${searchParams}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json() as Promise<TelemetryAggregatesDTO>;
    },
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minut
  });
}

/**
 * Hook do pobierania logów e-mail
 * @param initialData - Optional initial data from SSR
 */
export function useEmailLogs(initialData?: EmailLogDTO[]) {
  const params = {
    limit: 10,
    sortBy: "sentAt",
    sortDir: "desc",
  };

  return useQuery({
    queryKey: emailLogsKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        limit: params.limit.toString(),
        sortBy: params.sortBy,
        sortDir: params.sortDir,
      });

      const response = await fetch(`/api/email-logs?${searchParams}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: EmailLogsListResponseDTO = await response.json();
      return data.items;
    },
    initialData,
    staleTime: 60 * 1000, // 1 minuta
  });
}
