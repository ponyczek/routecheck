import { describe, it, expect } from "vitest";

import { deriveReportDate, computeIsProblem } from "../reportsService";
import type { PublicReportSubmitPayload } from "../../validation/public-report.schema";

describe("reportsService", () => {
  describe("deriveReportDate", () => {
    it("should derive correct date in specified timezone", () => {
      // January 1, 2025, 23:00 UTC
      const utcDate = new Date("2025-01-01T23:00:00Z");

      // In Warsaw (UTC+1), this is Jan 2, 2025
      const warsawDate = deriveReportDate(utcDate, "Europe/Warsaw");
      expect(warsawDate).toBe("2025-01-02");

      // In Los Angeles (UTC-8), this is still Jan 1, 2025
      const laDate = deriveReportDate(utcDate, "America/Los_Angeles");
      expect(laDate).toBe("2025-01-01");
    });

    it("should handle different timezones correctly", () => {
      const utcDate = new Date("2025-06-15T12:00:00Z");

      expect(deriveReportDate(utcDate, "UTC")).toBe("2025-06-15");
      expect(deriveReportDate(utcDate, "Asia/Tokyo")).toBe("2025-06-15");
      expect(deriveReportDate(utcDate, "America/New_York")).toBe("2025-06-15");
    });

    it("should throw error for invalid timezone", () => {
      const utcDate = new Date();

      expect(() => deriveReportDate(utcDate, "Invalid/Timezone")).toThrow("Invalid timezone");
    });

    it("should format date consistently as YYYY-MM-DD", () => {
      const utcDate = new Date("2025-03-05T10:00:00Z");
      const date = deriveReportDate(utcDate, "UTC");

      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(date).toBe("2025-03-05");
    });
  });

  describe("computeIsProblem", () => {
    const basePayload: PublicReportSubmitPayload = {
      routeStatus: "COMPLETED",
      delayMinutes: 0,
      delayReason: null,
      cargoDamageDescription: null,
      vehicleDamageDescription: null,
      nextDayBlockers: null,
      timezone: "Europe/Warsaw",
    };

    it("should return false for clean report", () => {
      expect(computeIsProblem(basePayload)).toBe(false);
    });

    it("should return true when delayMinutes > 0", () => {
      const payload = { ...basePayload, delayMinutes: 30 };
      expect(computeIsProblem(payload)).toBe(true);
    });

    it("should return true when cargo damage exists", () => {
      const payload = { ...basePayload, cargoDamageDescription: "Damaged box" };
      expect(computeIsProblem(payload)).toBe(true);
    });

    it("should return true when vehicle damage exists", () => {
      const payload = { ...basePayload, vehicleDamageDescription: "Scratched bumper" };
      expect(computeIsProblem(payload)).toBe(true);
    });

    it("should return true when next day blockers exist", () => {
      const payload = { ...basePayload, nextDayBlockers: "Vehicle in repair" };
      expect(computeIsProblem(payload)).toBe(true);
    });

    it("should return true when multiple issues exist", () => {
      const payload: PublicReportSubmitPayload = {
        ...basePayload,
        delayMinutes: 45,
        delayReason: "Traffic jam",
        cargoDamageDescription: "Package wet",
        vehicleDamageDescription: "Flat tire",
        nextDayBlockers: "Need new tire",
      };
      expect(computeIsProblem(payload)).toBe(true);
    });

    it("should handle empty strings as no problem", () => {
      const payload: PublicReportSubmitPayload = {
        ...basePayload,
        cargoDamageDescription: "",
        vehicleDamageDescription: "",
        nextDayBlockers: "",
      };
      expect(computeIsProblem(payload)).toBe(false);
    });
  });
});
