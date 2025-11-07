import { describe, it, expect } from "vitest";

import { publicReportSubmitSchema } from "../public-report.schema";

describe("publicReportSubmitSchema", () => {
  const validPayload = {
    routeStatus: "COMPLETED" as const,
    delayMinutes: 0,
    delayReason: null,
    cargoDamageDescription: null,
    vehicleDamageDescription: null,
    nextDayBlockers: null,
    timezone: "Europe/Warsaw",
  };

  describe("valid payloads", () => {
    it("should accept valid COMPLETED report", () => {
      const result = publicReportSubmitSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should accept PARTIALLY_COMPLETED with nextDayBlockers", () => {
      const payload = {
        ...validPayload,
        routeStatus: "PARTIALLY_COMPLETED",
        nextDayBlockers: "Road closed tomorrow",
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should accept CANCELLED status", () => {
      const payload = { ...validPayload, routeStatus: "CANCELLED" };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should accept delayMinutes with delayReason", () => {
      const payload = {
        ...validPayload,
        delayMinutes: 30,
        delayReason: "Heavy traffic",
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe("routeStatus validation", () => {
    it("should reject invalid routeStatus", () => {
      const payload = { ...validPayload, routeStatus: "INVALID" };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("should reject missing routeStatus", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { routeStatus, ...payload } = validPayload;
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("delayMinutes validation", () => {
    it("should reject negative delayMinutes", () => {
      const payload = { ...validPayload, delayMinutes: -10 };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer delayMinutes", () => {
      const payload = { ...validPayload, delayMinutes: 10.5 };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("should require delayReason when delayMinutes > 0", () => {
      const payload = {
        ...validPayload,
        delayMinutes: 15,
        delayReason: null,
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("delayReason");
      }
    });

    it("should accept delayReason when delayMinutes is 0", () => {
      const payload = {
        ...validPayload,
        delayMinutes: 0,
        delayReason: "Some reason",
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe("PARTIALLY_COMPLETED validation", () => {
    it("should require at least one descriptive field", () => {
      const payload = {
        ...validPayload,
        routeStatus: "PARTIALLY_COMPLETED",
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("should accept with cargoDamageDescription", () => {
      const payload = {
        ...validPayload,
        routeStatus: "PARTIALLY_COMPLETED",
        cargoDamageDescription: "Box damaged",
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should accept with vehicleDamageDescription", () => {
      const payload = {
        ...validPayload,
        routeStatus: "PARTIALLY_COMPLETED",
        vehicleDamageDescription: "Tire puncture",
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should accept with delayReason", () => {
      const payload = {
        ...validPayload,
        routeStatus: "PARTIALLY_COMPLETED",
        delayMinutes: 20,
        delayReason: "Accident on highway",
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe("text field length validation", () => {
    it("should reject delayReason over 2000 characters", () => {
      const payload = {
        ...validPayload,
        delayMinutes: 10,
        delayReason: "x".repeat(2001),
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("should accept delayReason at 2000 characters", () => {
      const payload = {
        ...validPayload,
        delayMinutes: 10,
        delayReason: "x".repeat(2000),
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject cargoDamageDescription over 2000 characters", () => {
      const payload = {
        ...validPayload,
        cargoDamageDescription: "x".repeat(2001),
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("should reject vehicleDamageDescription over 2000 characters", () => {
      const payload = {
        ...validPayload,
        vehicleDamageDescription: "x".repeat(2001),
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("should reject nextDayBlockers over 2000 characters", () => {
      const payload = {
        ...validPayload,
        nextDayBlockers: "x".repeat(2001),
      };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("timezone validation", () => {
    it("should accept valid IANA timezone", () => {
      const payload = { ...validPayload, timezone: "America/New_York" };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject empty timezone", () => {
      const payload = { ...validPayload, timezone: "" };
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("should reject missing timezone", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { timezone, ...payload } = validPayload;
      const result = publicReportSubmitSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
