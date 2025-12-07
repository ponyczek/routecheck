import { z } from "zod";
import type { ReportRouteStatus, ReportRiskLevel } from "@/types";

/**
 * Base schema for report fields (without driverUuid)
 */
const baseReportFieldsSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "reportDate must be in YYYY-MM-DD format"),
  timezone: z.string().min(1, "timezone is required"),
  routeStatus: z.enum(["COMPLETED", "PARTIALLY_COMPLETED", "CANCELLED"], {
    errorMap: () => ({ message: "routeStatus must be COMPLETED, PARTIALLY_COMPLETED, or CANCELLED" }),
  }) as z.ZodType<ReportRouteStatus>,
  delayMinutes: z
    .number()
    .min(0, "delayMinutes must be greater than or equal to 0")
    .int("delayMinutes must be an integer")
    .default(0),
  delayReason: z.string().max(2000, "delayReason must not exceed 2000 characters").nullable().optional(),
  cargoDamageDescription: z
    .string()
    .max(2000, "cargoDamageDescription must not exceed 2000 characters")
    .nullable()
    .optional(),
  vehicleDamageDescription: z
    .string()
    .max(2000, "vehicleDamageDescription must not exceed 2000 characters")
    .nullable()
    .optional(),
  nextDayBlockers: z.string().max(2000, "nextDayBlockers must not exceed 2000 characters").nullable().optional(),
  isProblem: z.boolean().default(false),
  riskLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).nullable().optional() as z.ZodType<
    ReportRiskLevel | null | undefined
  >,
  tags: z.array(z.string()).optional(),
});

/**
 * Validation schema for CreateReportCommand
 *
 * Business rules:
 * - driverUuid must be a valid UUID
 * - reportDate must be a valid date (YYYY-MM-DD format)
 * - reportDate cannot be in the future
 * - timezone must be a valid IANA timezone identifier
 * - routeStatus must be valid enum value
 * - delayMinutes must be >= 0
 * - If delayMinutes > 0, delayReason is required
 * - For PARTIALLY_COMPLETED status, at least one descriptive field must be filled
 */
export const createReportSchema = baseReportFieldsSchema
  .extend({
    driverUuid: z.string().uuid("driverUuid must be a valid UUID"),
  })
  .refine(
    (data) => {
      // reportDate cannot be in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reportDate = new Date(data.reportDate);
      reportDate.setHours(0, 0, 0, 0);
      return reportDate <= today;
    },
    {
      message: "reportDate cannot be in the future",
      path: ["reportDate"],
    }
  )
  .refine(
    (data) => {
      // If delayMinutes > 0, delayReason must be provided
      if (data.delayMinutes > 0 && !data.delayReason) {
        return false;
      }
      return true;
    },
    {
      message: "delayReason is required when delayMinutes is greater than 0",
      path: ["delayReason"],
    }
  )
  .refine(
    (data) => {
      // For PARTIALLY_COMPLETED, at least one descriptive field must be filled
      if (data.routeStatus === "PARTIALLY_COMPLETED") {
        const hasDescription =
          !!data.nextDayBlockers ||
          !!data.cargoDamageDescription ||
          !!data.vehicleDamageDescription ||
          !!data.delayReason;
        return hasDescription;
      }
      return true;
    },
    {
      message:
        "For PARTIALLY_COMPLETED status, at least one descriptive field (nextDayBlockers, cargoDamageDescription, vehicleDamageDescription, or delayReason) must be provided",
      path: ["routeStatus"],
    }
  );

export type CreateReportPayload = z.infer<typeof createReportSchema>;

/**
 * Validation schema for UpdateReportCommand
 * Same as CreateReportCommand but all fields except driverUuid are optional
 */
export const updateReportSchema = baseReportFieldsSchema
  .partial()
  .refine(
    (data) => {
      // If delayMinutes > 0, delayReason must be provided
      if (data.delayMinutes && data.delayMinutes > 0 && !data.delayReason) {
        return false;
      }
      return true;
    },
    {
      message: "delayReason is required when delayMinutes is greater than 0",
      path: ["delayReason"],
    }
  )
  .refine(
    (data) => {
      // For PARTIALLY_COMPLETED, at least one descriptive field must be filled
      if (data.routeStatus === "PARTIALLY_COMPLETED") {
        const hasDescription =
          !!data.nextDayBlockers ||
          !!data.cargoDamageDescription ||
          !!data.vehicleDamageDescription ||
          !!data.delayReason;
        return hasDescription;
      }
      return true;
    },
    {
      message:
        "For PARTIALLY_COMPLETED status, at least one descriptive field (nextDayBlockers, cargoDamageDescription, vehicleDamageDescription, or delayReason) must be provided",
      path: ["routeStatus"],
    }
  );

export type UpdateReportPayload = z.infer<typeof updateReportSchema>;

/**
 * Schema for reports list filters (used for URL params parsing)
 */
export const reportsFiltersSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  q: z.string().optional(),
  driverUuid: z.array(z.string().uuid()).optional(),
  riskLevel: z.array(z.enum(["NONE", "LOW", "MEDIUM", "HIGH"])).optional(),
  routeStatus: z.array(z.enum(["COMPLETED", "PARTIALLY_COMPLETED", "CANCELLED"])).optional(),
  includeAi: z.boolean().default(true),
});

export type ReportsFiltersState = z.infer<typeof reportsFiltersSchema>;
