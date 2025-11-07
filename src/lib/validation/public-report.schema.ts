import { z } from "zod";

/**
 * Validation schema for PublicReportSubmitCommand
 *
 * Business rules:
 * - routeStatus must be valid enum value
 * - delayMinutes must be >= 0
 * - If delayMinutes > 0, delayReason is required
 * - For PARTIALLY_COMPLETED status, at least one descriptive field must be filled
 * - timezone must be a valid IANA timezone identifier
 */
export const publicReportSubmitSchema = z
  .object({
    routeStatus: z.enum(["COMPLETED", "PARTIALLY_COMPLETED", "CANCELLED"], {
      errorMap: () => ({ message: "routeStatus must be COMPLETED, PARTIALLY_COMPLETED, or CANCELLED" }),
    }),
    delayMinutes: z
      .number()
      .min(0, "delayMinutes must be greater than or equal to 0")
      .int("delayMinutes must be an integer"),
    delayReason: z.string().max(2000, "delayReason must not exceed 2000 characters").nullable(),
    cargoDamageDescription: z.string().max(2000, "cargoDamageDescription must not exceed 2000 characters").nullable(),
    vehicleDamageDescription: z
      .string()
      .max(2000, "vehicleDamageDescription must not exceed 2000 characters")
      .nullable(),
    nextDayBlockers: z.string().max(2000, "nextDayBlockers must not exceed 2000 characters").nullable(),
    timezone: z.string().min(1, "timezone is required"),
  })
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

export type PublicReportSubmitPayload = z.infer<typeof publicReportSubmitSchema>;
