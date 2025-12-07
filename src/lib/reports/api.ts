import type {
  ReportsListResponseDTO,
  ReportDetailDTO,
  ReportListItemDTO,
  CreateReportCommand,
  UpdateReportCommand,
} from "@/types";
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
 * Query parameters for reports list endpoint
 */
export interface ReportsQueryParams {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  q?: string;
  driverUuid?: string[];
  riskLevel?: string[];
  routeStatus?: string[];
  includeAi?: boolean;
  limit?: number;
  cursor?: string;
  sortBy?: "reportDate" | "occurredAt" | "riskLevel";
  sortDir?: "asc" | "desc";
}

/**
 * Fetches list of reports with optional filters
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated list of reports
 */
export async function fetchReportsList(
  params: ReportsQueryParams
): Promise<ReportsListResponseDTO> {
  const token = await getSupabaseToken();
  const queryParams = new URLSearchParams();

  // Required params
  queryParams.set("from", params.from);
  queryParams.set("to", params.to);

  // Optional params
  if (params.q) queryParams.set("q", params.q);
  if (params.driverUuid) {
    params.driverUuid.forEach((uuid) => queryParams.append("driverUuid", uuid));
  }
  if (params.riskLevel) {
    params.riskLevel.forEach((level) => queryParams.append("riskLevel", level));
  }
  if (params.routeStatus) {
    params.routeStatus.forEach((status) => queryParams.append("routeStatus", status));
  }
  if (params.includeAi !== undefined) queryParams.set("includeAi", String(params.includeAi));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.cursor) queryParams.set("cursor", params.cursor);
  if (params.sortBy) queryParams.set("sortBy", params.sortBy);
  if (params.sortDir) queryParams.set("sortDir", params.sortDir);

  const response = await fetch(`/api/reports?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch reports: ${response.status} ${response.statusText}`,
      { cause: errorData }
    );
  }

  return response.json();
}

/**
 * Fetches a single report by UUID with optional AI and tags data
 * @param uuid - Report UUID
 * @param includeAi - Include AI analysis data
 * @param includeTags - Include risk tags
 * @returns Report detail DTO
 */
export async function fetchReportById(
  uuid: string,
  includeAi = true,
  includeTags = true
): Promise<ReportDetailDTO> {
  const token = await getSupabaseToken();
  const queryParams = new URLSearchParams();

  if (includeAi) queryParams.set("includeAi", "true");
  if (includeTags) queryParams.set("includeTags", "true");

  const response = await fetch(`/api/reports/${uuid}?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 404) {
      throw new Error("NOT_FOUND");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch report: ${response.status} ${response.statusText}`,
      { cause: errorData }
    );
  }

  return response.json();
}

/**
 * Creates a new report (admin/dispatcher action)
 * @param data - Report creation command
 * @returns Created report detail DTO
 */
export async function createReport(
  data: CreateReportCommand
): Promise<ReportDetailDTO> {
  const token = await getSupabaseToken();

  const response = await fetch("/api/reports", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 409) {
      throw new Error("DUPLICATE");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to create report: ${response.status} ${response.statusText}`,
      { cause: errorData }
    );
  }

  return response.json();
}

/**
 * Updates an existing report (admin/dispatcher action)
 * @param uuid - Report UUID
 * @param data - Report update command
 * @returns Updated report detail DTO
 */
export async function updateReport(
  uuid: string,
  data: UpdateReportCommand
): Promise<ReportDetailDTO> {
  const token = await getSupabaseToken();

  const response = await fetch(`/api/reports/${uuid}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 404) {
      throw new Error("NOT_FOUND");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to update report: ${response.status} ${response.statusText}`,
      { cause: errorData }
    );
  }

  return response.json();
}

/**
 * Deletes a report (admin action)
 * @param uuid - Report UUID
 */
export async function deleteReport(uuid: string): Promise<void> {
  const token = await getSupabaseToken();

  const response = await fetch(`/api/reports/${uuid}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 404) {
      throw new Error("NOT_FOUND");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to delete report: ${response.status} ${response.statusText}`,
      { cause: errorData }
    );
  }
}

/**
 * Exports reports as CSV
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @param includeAi - Include AI analysis columns
 * @param includeTags - Include risk tags columns
 * @returns Blob containing CSV data
 */
export async function exportReportsCsv(
  from: string,
  to: string,
  includeAi = true,
  includeTags = true
): Promise<Blob> {
  const token = await getSupabaseToken();
  const queryParams = new URLSearchParams();

  queryParams.set("from", from);
  queryParams.set("to", to);
  if (includeAi) queryParams.set("includeAi", "true");
  if (includeTags) queryParams.set("includeTags", "true");

  const response = await fetch(`/api/reports/export?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 400) {
      throw new Error("INVALID_DATE_RANGE");
    }
    if (response.status === 413) {
      throw new Error("RANGE_TOO_LARGE");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to export reports: ${response.status} ${response.statusText}`,
      { cause: errorData }
    );
  }

  return response.blob();
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
    if (error.message === "NOT_FOUND") {
      return "Nie znaleziono raportu.";
    }
    if (error.message === "DUPLICATE") {
      return "Raport dla tego kierowcy i daty już istnieje.";
    }
    if (error.message === "INVALID_DATE_RANGE") {
      return "Nieprawidłowy zakres dat.";
    }
    if (error.message === "RANGE_TOO_LARGE") {
      return "Zakres dat jest zbyt duży. Wybierz krótszy okres.";
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

