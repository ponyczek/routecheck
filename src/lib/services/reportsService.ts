import type { SupabaseClient } from "../../db/supabase.client";
import type { Uuid, IsoDateString } from "../../types";
import type { PublicReportSubmitPayload } from "../validation/public-report.schema";

/**
 * Derives the report date (YYYY-MM-DD) from a UTC timestamp and timezone
 * @param nowUtc - Current UTC timestamp
 * @param timezone - IANA timezone identifier (e.g., "Europe/Warsaw")
 * @returns Date string in YYYY-MM-DD format
 */
export function deriveReportDate(nowUtc: Date, timezone: string): string {
  try {
    // Use Intl.DateTimeFormat to get the local date in the specified timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // Format returns YYYY-MM-DD for en-CA locale
    return formatter.format(nowUtc);
  } catch {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
}

/**
 * Determines if a report should be flagged as a problem
 * @param payload - Report submission data
 * @returns true if report contains any problem indicators
 */
export function computeIsProblem(payload: PublicReportSubmitPayload): boolean {
  return (
    payload.delayMinutes > 0 ||
    !!payload.cargoDamageDescription ||
    !!payload.vehicleDamageDescription ||
    !!payload.nextDayBlockers
  );
}

/**
 * Context from a validated report link
 */
export interface ReportLinkContext {
  driverUuid: Uuid;
  companyUuid: Uuid;
}

/**
 * Result of creating a report
 */
export interface CreateReportResult {
  uuid: Uuid;
  occurredAt: IsoDateString;
}

/**
 * Error thrown when report creation fails due to duplicate
 */
export class ReportDuplicateError extends Error {
  constructor(
    message: string,
    public readonly existingReportUuid?: Uuid
  ) {
    super(message);
    this.name = "ReportDuplicateError";
  }
}

/**
 * Creates a new report from a public submission
 * @param supabase - Supabase service client
 * @param linkContext - Context from the validated report link
 * @param payload - Validated report submission data
 * @param reportDate - Computed report date (YYYY-MM-DD)
 * @param occurredAt - Timestamp when the report was submitted
 * @returns Report UUID and occurred_at timestamp
 * @throws {ReportDuplicateError} if a report already exists for this driver and date
 */
export async function createReportFromPublic(
  supabase: SupabaseClient,
  linkContext: ReportLinkContext,
  payload: PublicReportSubmitPayload,
  reportDate: string,
  occurredAt: Date
): Promise<CreateReportResult> {
  const isProblem = computeIsProblem(payload);

  const { data, error } = await supabase
    .from("reports")
    .insert({
      driver_uuid: linkContext.driverUuid,
      company_uuid: linkContext.companyUuid,
      report_date: reportDate,
      timezone: payload.timezone,
      occurred_at: occurredAt.toISOString(),
      route_status: payload.routeStatus,
      delay_minutes: payload.delayMinutes,
      delay_reason: payload.delayReason,
      cargo_damage_description: payload.cargoDamageDescription,
      vehicle_damage_description: payload.vehicleDamageDescription,
      next_day_blockers: payload.nextDayBlockers,
      is_problem: isProblem,
      risk_level: null, // Will be set by AI processing
    })
    .select("uuid, occurred_at")
    .single();

  if (error) {
    // Check for unique constraint violation on (driver_uuid, report_date)
    if (error.code === "23505" && error.message.includes("driver_uuid")) {
      // Try to fetch the existing report UUID
      const { data: existingReport } = await supabase
        .from("reports")
        .select("uuid")
        .eq("driver_uuid", linkContext.driverUuid)
        .eq("report_date", reportDate)
        .single();

      throw new ReportDuplicateError("A report for this driver and date already exists", existingReport?.uuid);
    }

    throw new Error(`Failed to create report: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to create report: no data returned");
  }

  return {
    uuid: data.uuid,
    occurredAt: data.occurred_at,
  };
}

/**
 * Schedules AI reprocessing for a report (stub implementation)
 * In production, this would trigger an edge function or queue job
 * @param _reportUuid - UUID of the report to reprocess (unused in stub)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function scheduleAiReprocess(_reportUuid: Uuid): Promise<void> {
  // TODO: Implement actual AI reprocessing trigger
  // This could be:
  // - Edge function invocation
  // - Message queue publish
  // - Database trigger
}
