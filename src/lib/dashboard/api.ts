import type {
  ReportsTodaySummaryDTO,
  ReportListItemDTO,
  ReportsListResponseDTO,
  DriversListResponseDTO,
} from "@/types";
import type { PendingDriver } from "./types";
import { supabaseBrowserClient } from "@/db/supabase.client";

/**
 * Gets the current Supabase session token for authenticated API requests
 * @throws {Error} if no session is available
 * @returns JWT access token
 */
async function getSupabaseToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabaseBrowserClient.auth.getSession();

  if (error || !session) {
    throw new Error("UNAUTHORIZED");
  }

  return session.access_token;
}

/**
 * Fetches today's reports summary from the API
 * @param date - Date in YYYY-MM-DD format
 * @param timezone - IANA timezone identifier
 * @returns Summary with metrics and risk breakdown
 */
export async function fetchReportsTodaySummary(date: string, timezone: string): Promise<ReportsTodaySummaryDTO> {
  const token = await getSupabaseToken();
  const response = await fetch(`/api/reports/today/summary?timezone=${encodeURIComponent(timezone)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(`Failed to fetch summary: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches today's reports with AI data
 * @param date - Date in YYYY-MM-DD format
 * @param _timezone - IANA timezone identifier (unused but kept for future use)
 * @returns List of reports with AI analysis
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function fetchTodayReports(date: string, _timezone: string): Promise<ReportListItemDTO[]> {
  const token = await getSupabaseToken();
  const response = await fetch(`/api/reports?from=${date}&to=${date}&includeAi=true&sortBy=reportDate&sortDir=desc`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(`Failed to fetch reports: ${response.status} ${response.statusText}`);
  }

  const data: ReportsListResponseDTO = await response.json();
  return data.items;
}

/**
 * Fetches list of drivers who haven't submitted a report today
 * @param date - Date in YYYY-MM-DD format
 * @param _timezone - IANA timezone identifier (unused but kept for future use)
 * @returns List of pending drivers
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function fetchPendingDrivers(date: string, _timezone: string): Promise<PendingDriver[]> {
  const token = await getSupabaseToken();

  // 1. Fetch all active drivers
  const driversResponse = await fetch(`/api/drivers?isActive=true&includeDeleted=false`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!driversResponse.ok) {
    if (driversResponse.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(`Failed to fetch drivers: ${driversResponse.status} ${driversResponse.statusText}`);
  }

  const driversData: DriversListResponseDTO = await driversResponse.json();
  const allDrivers = driversData.items;

  // 2. Fetch today's reports
  const reportsResponse = await fetch(`/api/reports?from=${date}&to=${date}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!reportsResponse.ok) {
    if (reportsResponse.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(`Failed to fetch reports: ${reportsResponse.status} ${reportsResponse.statusText}`);
  }

  const reportsData: ReportsListResponseDTO = await reportsResponse.json();
  const reportedDriverUuids = new Set(reportsData.items.map((r) => r.driverUuid));

  // 3. Calculate pending drivers (active drivers without a report today)
  const pending: PendingDriver[] = allDrivers
    .filter((driver) => !reportedDriverUuids.has(driver.uuid))
    .map((driver) => ({
      uuid: driver.uuid,
      name: driver.name,
      email: driver.email,
      timezone: driver.timezone,
      vehicleRegistration: null, // TODO: join with assignments when available
      linkSentAt: null, // TODO: join with report_links when available
    }));

  return pending;
}

/**
 * Handles API errors and provides user-friendly error messages
 * @param error - Error object from API call
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return "Sesja wygasła. Zaloguj się ponownie.";
    }
    if (error.message.includes("Failed to fetch")) {
      return "Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.";
    }
    if (error.message.includes("429")) {
      return "Przekroczono limit żądań. Poczekaj chwilę i spróbuj ponownie.";
    }
    if (error.message.includes("500")) {
      return "Wystąpił błąd serwera. Spróbuj ponownie za chwilę.";
    }
    return error.message;
  }
  return "Wystąpił nieoczekiwany błąd.";
}
