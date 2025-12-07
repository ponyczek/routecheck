import type {
  PublicReportLinkValidationDTO,
  PublicReportSubmitCommand,
  PublicReportSubmitResponseDTO,
  PublicReportUpdateCommand,
  TelemetryEventCommand,
  ProblemDetail,
  Uuid,
} from "@/types";

/**
 * Base URL for public report API endpoints
 */
const API_BASE = "/api";

/**
 * Validates a public report link token
 * @param token - The report link token from URL
 * @returns Validation data including driver info and expiration
 * @throws ProblemDetail on 404/409/410 or other errors
 */
export async function validateToken(token: string): Promise<PublicReportLinkValidationDTO> {
  const response = await fetch(`${API_BASE}/public/report-links/${token}`);

  if (!response.ok) {
    const error = (await response.json()) as ProblemDetail;
    throw error;
  }

  return response.json();
}

/**
 * Submits a new report using a public link token
 * @param token - The report link token
 * @param data - Report submission data
 * @returns Response with report UUID and editable until timestamp
 * @throws ProblemDetail on validation errors or token issues
 */
export async function submitReport(
  token: string,
  data: PublicReportSubmitCommand
): Promise<PublicReportSubmitResponseDTO> {
  const response = await fetch(`${API_BASE}/public/report-links/${token}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = (await response.json()) as ProblemDetail;
    throw error;
  }

  return response.json();
}

/**
 * Updates an existing public report within the editable window (10 minutes)
 * @param reportUuid - UUID of the report to update
 * @param token - The original report link token (used for authorization)
 * @param data - Partial report data to update
 * @throws ProblemDetail on 403 (unauthorized), 409 (edit window expired), or validation errors
 */
export async function updateReport(reportUuid: Uuid, token: string, data: PublicReportUpdateCommand): Promise<void> {
  const response = await fetch(`${API_BASE}/public/reports/${reportUuid}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = (await response.json()) as ProblemDetail;
    throw error;
  }
}

/**
 * Sends telemetry event data (fire-and-forget)
 * Errors are logged but don't block the UI
 * @param data - Telemetry event data
 */
export async function sendTelemetry(data: TelemetryEventCommand): Promise<void> {
  try {
    await fetch(`${API_BASE}/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    // Fire-and-forget: log but don't throw
    console.warn("Telemetry failed:", error);
  }
}

/**
 * Helper to determine error type from HTTP status or error code
 * @param error - The error object from API
 * @returns Error type for ErrorView
 */
export function getErrorType(error: ProblemDetail): "404" | "409" | "410" | "500" {
  const code = error.code;

  if (code === "404" || code.includes("NOT_FOUND")) return "404";
  if (code === "409" || code.includes("CONFLICT") || code.includes("ALREADY_USED")) return "409";
  if (code === "410" || code.includes("GONE") || code.includes("EXPIRED")) return "410";

  return "500";
}
