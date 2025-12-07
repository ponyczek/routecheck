import { z } from "zod";
import type { ReportRouteStatus } from "@/types";

/**
 * Zod schema for public report form validation
 * Validates both happy path and problem path scenarios
 */
export const reportFormSchema = z
  .object({
    isProblem: z.boolean(),
    routeStatus: z.enum(["COMPLETED", "PARTIALLY_COMPLETED", "CANCELLED"] as const),
    delayMinutes: z.number().int().min(0, "Opóźnienie nie może być ujemne"),
    delayReason: z.string().max(1000, "Maksymalnie 1000 znaków"),
    cargoDamageDescription: z.string().max(1000, "Maksymalnie 1000 znaków").nullable(),
    vehicleDamageDescription: z.string().max(1000, "Maksymalnie 1000 znaków").nullable(),
    nextDayBlockers: z.string().max(1000, "Maksymalnie 1000 znaków").nullable(),
    timezone: z.string().min(1, "Timezone jest wymagany"),
  })
  .refine(
    (data) => {
      // Jeśli happy path, ignoruj walidacje problemów
      if (!data.isProblem) return true;

      // Jeśli opóźnienie > 0, powód wymagany i min 3 znaki
      if (data.delayMinutes > 0) {
        if (!data.delayReason || data.delayReason.trim().length === 0) {
          return false;
        }
        if (data.delayReason.trim().length < 3) {
          return false;
        }
      }

      return true;
    },
    {
      message: "Powód opóźnienia jest wymagany gdy opóźnienie > 0 minut (minimum 3 znaki)",
      path: ["delayReason"],
    }
  )
  .refine(
    (data) => {
      // Jeśli happy path, ignoruj walidacje problemów
      if (!data.isProblem) return true;

      // Jeśli częściowe wykonanie, komentarz wymagany
      if (data.routeStatus === "PARTIALLY_COMPLETED") {
        const hasDelayReason = data.delayReason && data.delayReason.trim().length > 0;
        const hasBlockers = data.nextDayBlockers && data.nextDayBlockers.trim().length > 0;

        if (!hasDelayReason && !hasBlockers) {
          return false;
        }
      }

      return true;
    },
    {
      message: "Przy częściowym wykonaniu wymagany jest komentarz w powodzie opóźnienia lub problemy na jutro",
      path: ["nextDayBlockers"],
    }
  );

/**
 * Type inference from Zod schema - used for React Hook Form
 */
export type ReportFormViewModel = z.infer<typeof reportFormSchema>;

/**
 * Token validation state for TokenGuard component
 */
export interface TokenValidationState {
  isValidating: boolean;
  isValid: boolean;
  validationData: import("@/types").PublicReportLinkValidationDTO | null;
  error: import("@/types").ProblemDetail | null;
}

/**
 * Form submission state for PublicReportForm
 */
export interface FormSubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: import("@/types").ProblemDetail | null;
  responseData: import("@/types").PublicReportSubmitResponseDTO | null;
}

/**
 * Telemetry state for tracking form interactions
 */
export interface TelemetryFormState {
  startTime: number; // timestamp
  endTime: number | null;
  interactions: number; // liczba interakcji z polami
  switchedToProblems: boolean;
}

/**
 * Union type for main view state machine
 */
export type FormViewState =
  | { type: "loading" }
  | { type: "form"; data: import("@/types").PublicReportLinkValidationDTO }
  | { type: "success"; data: import("@/types").PublicReportSubmitResponseDTO }
  | { type: "error"; errorType: "404" | "409" | "410" | "500"; message?: string };

/**
 * Error type for error view
 */
export type ErrorType = "404" | "409" | "410" | "500";

/**
 * Offline queue item structure for IndexedDB
 */
export interface OfflineQueueItem {
  id: string;
  token: string;
  data: import("@/types").PublicReportSubmitCommand;
  createdAt: import("@/types").IsoDateString;
  retries: number;
}
