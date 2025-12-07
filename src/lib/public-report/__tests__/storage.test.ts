import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isTokenUsed, markTokenAsUsed, storeReportToken, getReportToken, clearReportStorage } from "../utils/storage";

describe("storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe("isTokenUsed", () => {
    it("should return false for unused token", () => {
      const token = "test-token-123";
      expect(isTokenUsed(token)).toBe(false);
    });

    it("should return true for used token", () => {
      const token = "test-token-123";
      markTokenAsUsed(token);
      expect(isTokenUsed(token)).toBe(true);
    });
  });

  describe("markTokenAsUsed", () => {
    it("should mark token as used in sessionStorage", () => {
      const token = "test-token-456";
      markTokenAsUsed(token);

      const key = `routelog:token:${token}`;
      const stored = sessionStorage.getItem(key);

      expect(stored).toBeTruthy();
      expect(new Date(stored!).toString()).not.toBe("Invalid Date");
    });

    it("should store ISO timestamp", () => {
      const token = "test-token-789";
      markTokenAsUsed(token);

      const key = `routelog:token:${token}`;
      const stored = sessionStorage.getItem(key);

      expect(stored).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });
  });

  describe("storeReportToken", () => {
    it("should store report-token association", () => {
      const reportUuid = "report-uuid-123";
      const token = "token-abc";

      storeReportToken(reportUuid, token);

      const key = `routelog:report:${reportUuid}`;
      const stored = sessionStorage.getItem(key);

      expect(stored).toBe(token);
    });
  });

  describe("getReportToken", () => {
    it("should retrieve token for report", () => {
      const reportUuid = "report-uuid-456";
      const token = "token-def";

      storeReportToken(reportUuid, token);
      const retrieved = getReportToken(reportUuid);

      expect(retrieved).toBe(token);
    });

    it("should return null for non-existent report", () => {
      const reportUuid = "non-existent-uuid";
      const retrieved = getReportToken(reportUuid);

      expect(retrieved).toBeNull();
    });
  });

  describe("clearReportStorage", () => {
    it("should clear all routelog keys", () => {
      // Store multiple items
      markTokenAsUsed("token-1");
      markTokenAsUsed("token-2");
      storeReportToken("report-1", "token-1");
      storeReportToken("report-2", "token-2");

      // Also store non-routelog item
      sessionStorage.setItem("other-key", "other-value");

      clearReportStorage();

      // Check routelog items are cleared
      expect(isTokenUsed("token-1")).toBe(false);
      expect(isTokenUsed("token-2")).toBe(false);
      expect(getReportToken("report-1")).toBeNull();
      expect(getReportToken("report-2")).toBeNull();

      // Check other item is preserved
      expect(sessionStorage.getItem("other-key")).toBe("other-value");
    });

    it("should handle empty storage", () => {
      expect(() => clearReportStorage()).not.toThrow();
    });
  });
});
