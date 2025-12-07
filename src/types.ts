import type { Tables, TablesInsert, Enums } from "./db/database.types";

/**
 * Utilities to derive API-facing (camelCase) DTOs and Commands
 * directly from database entity types (snake_case).
 */

// Convert snake_case string literal types to camelCase at the type level
type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Lowercase<Head>}${Capitalize<CamelCase<Tail>>}`
  : S;

// Pick a subset of keys and camelCase them
type PickCamel<T, K extends keyof T> = {
  [P in K as P extends string ? CamelCase<P> : P]: T[P];
};

// Common primitives
export type Uuid = string;
export type IsoDateString = string; // ISO 8601 string
export type IsoDateOnlyString = string; // YYYY-MM-DD

// Enums (directly tied to DB enums)
export type ReportRouteStatus = Enums<"report_route_status">;
export type ReportRiskLevel = Enums<"report_risk_level">;

// Problem Details per API error model
export interface ProblemDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination wrapper used by list endpoints
export interface Paginated<TItem> {
  items: TItem[];
  nextCursor: string | null;
}

/**
 * Companies
 */
export type CompanyDTO = PickCamel<Tables<"companies">, "uuid" | "name" | "created_at"> & {
  // created_at is emitted as createdAt (camelized)
};

export interface UpdateCompanyCommand {
  name: string;
}

/**
 * Users
 */
export type UserDTO = PickCamel<Tables<"users">, "uuid" | "company_uuid" | "created_at">;

/**
 * Drivers
 */
export type DriverDTO = PickCamel<
  Tables<"drivers">,
  "uuid" | "name" | "email" | "timezone" | "is_active" | "created_at" | "deleted_at"
>;

export type CreateDriverCommand = PickCamel<TablesInsert<"drivers">, "name" | "email" | "timezone" | "is_active">;

export type UpdateDriverCommand = Partial<CreateDriverCommand>;

export type DriversListResponseDTO = Paginated<DriverDTO>;

/**
 * Vehicles
 */
export type VehicleDTO = PickCamel<
  Tables<"vehicles">,
  "uuid" | "registration_number" | "vin" | "is_active" | "created_at" | "deleted_at"
>;

export type CreateVehicleCommand = PickCamel<TablesInsert<"vehicles">, "registration_number" | "vin" | "is_active">;

export type UpdateVehicleCommand = Partial<CreateVehicleCommand>;

export type VehiclesListResponseDTO = Paginated<VehicleDTO>;

/**
 * Driver–Vehicle Assignments
 */
export type AssignmentDTO = PickCamel<
  Tables<"driver_vehicle_assignments">,
  "uuid" | "driver_uuid" | "vehicle_uuid" | "company_uuid" | "start_date" | "end_date"
>;

export type CreateAssignmentCommand = PickCamel<
  TablesInsert<"driver_vehicle_assignments">,
  "driver_uuid" | "vehicle_uuid" | "start_date" | "end_date"
>;

export type UpdateAssignmentCommand = Partial<CreateAssignmentCommand>;

export type AssignmentsListResponseDTO = Paginated<AssignmentDTO>;

/**
 * Risk Tags (dictionary)
 */
export type RiskTagDTO = PickCamel<Tables<"risk_tags">, "id" | "tag_name">;

export type RiskTagsListResponseDTO = RiskTagDTO[];

export interface ReplaceReportRiskTagsCommand {
  tags: string[]; // tag names (map to risk_tags.tag_name on write)
}

/**
 * Reports and AI
 */
export type ReportDTO = PickCamel<
  Tables<"reports">,
  | "uuid"
  | "company_uuid"
  | "driver_uuid"
  | "report_date"
  | "timezone"
  | "occurred_at"
  | "route_status"
  | "delay_minutes"
  | "delay_reason"
  | "cargo_damage_description"
  | "vehicle_damage_description"
  | "next_day_blockers"
  | "is_problem"
  | "risk_level"
  | "created_at"
  | "updated_at"
>;

export type ReportAiResultDTO = PickCamel<
  Tables<"report_ai_results">,
  "report_uuid" | "report_date" | "ai_summary" | "risk_level" | "created_at" | "updated_at"
>;

// List item used by GET /api/reports (optionally includes AI)
export type ReportListItemDTO = ReportDTO & {
  ai?: ReportAiResultDTO | null;
};

export type ReportsListResponseDTO = Paginated<ReportListItemDTO>;

// Detailed report used by GET /api/reports/{uuid}
export type ReportDetailDTO = ReportDTO & {
  ai?: ReportAiResultDTO | null;
  tags?: string[]; // risk tag names (join from report_risk_tags + risk_tags)
};

// Dashboard summary used by GET /api/reports/today/summary
export interface ReportsTodaySummaryDTO {
  totalActiveDrivers: number;
  submittedCount: number;
  pendingCount: number;
  riskBreakdown: {
    none: number;
    low: number;
    medium: number;
    high: number;
  };
}

// Admin create report command (server derives company from auth)
type CreateReportCommandBase = PickCamel<
  TablesInsert<"reports">,
  | "driver_uuid"
  | "report_date"
  | "timezone"
  | "route_status"
  | "delay_minutes"
  | "delay_reason"
  | "cargo_damage_description"
  | "vehicle_damage_description"
  | "next_day_blockers"
  | "is_problem"
  | "risk_level"
>;

export type CreateReportCommand = CreateReportCommandBase & {
  /**
   * Optional list of risk tag names to associate with the report.
   * These map to the risk_tags dictionary via (report_uuid, report_date).
   */
  tags?: string[];
};

export type UpdateReportCommand = Omit<Partial<CreateReportCommand>, "driverUuid" | "tags"> & {
  // Allow updating tags through a dedicated endpoint
};

/**
 * AI endpoints
 */
export type ReprocessReportAiCommand = Record<string, never>; // POST body is empty; uses path params

/**
 * Report Links (public token flow)
 */
export interface GenerateReportLinksCommand {
  at?: IsoDateString;
  dryRun?: boolean;
  driverUuids?: Uuid[];
}

export interface ReportLinksGenerateResponseDTO {
  generated: number;
  skipped: number;
}

export type PublicReportLinkValidationDTO =
  | {
      valid: true;
      driverName: string;
      vehicleRegistration: string | null;
      expiresAt: IsoDateString;
      editableUntil: IsoDateString | null;
    }
  | {
      valid: false; // for 404/410/409 we return HTTP error; shape here covers only 200 path
      // Kept for future extensibility if a non-200 "soft" response is used
    };

export type PublicReportSubmitCommand = PickCamel<
  TablesInsert<"reports">,
  | "route_status"
  | "delay_minutes"
  | "delay_reason"
  | "cargo_damage_description"
  | "vehicle_damage_description"
  | "next_day_blockers"
  | "timezone"
>;

export type PublicReportUpdateCommand = Partial<PublicReportSubmitCommand>;

export interface PublicReportSubmitResponseDTO {
  reportUuid: Uuid;
  editableUntil: IsoDateString;
}

/**
 * Telemetry
 */
export type TelemetryEventCommand = PickCamel<
  TablesInsert<"telemetry_events">,
  "event_type" | "occurred_at" | "metadata" | "link_uuid" | "report_uuid"
>;

/**
 * Email Logs
 */
export type EmailLogDTO = PickCamel<
  Tables<"email_logs">,
  "uuid" | "recipient" | "subject" | "status" | "sent_at" | "error_message" | "company_uuid"
>;

export type EmailLogsListResponseDTO = Paginated<EmailLogDTO>;

/**
 * Settings - Alerts Configuration
 */
export interface AlertsConfigDTO {
  alertsEnabled: boolean;
  alertRecipientEmail: string; // info-only, from auth.users
}

export interface UpdateAlertsConfigCommand {
  alertsEnabled: boolean;
}

/**
 * Telemetry Aggregates
 */
export interface TelemetryAggregatesDTO {
  /**
   * Median form fill duration in seconds
   */
  medianFormDurationSeconds: number;

  /**
   * Total form submissions in analyzed period
   */
  totalFormSubmissions: number;

  /**
   * Conversion rate: % of links that led to report submission
   */
  conversionRate: number; // e.g. 0.73 = 73%

  /**
   * Trend compared to previous period (optional)
   */
  trend?: {
    medianDurationChange: number; // change in seconds (+ or -)
    conversionRateChange: number; // change in % (+ or -)
  };

  /**
   * Daily data for chart (optional)
   */
  dailyData?: TelemetryDataPoint[];
}

export interface TelemetryDataPoint {
  date: IsoDateOnlyString; // "YYYY-MM-DD"
  medianDurationSeconds: number;
  submissionCount: number;
}

/**
 * Health
 */
export interface HealthDTO {
  status: "ok";
  time: IsoDateString;
}
