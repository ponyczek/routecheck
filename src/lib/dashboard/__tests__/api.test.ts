import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchReportsTodaySummary, fetchTodayReports, fetchPendingDrivers, getErrorMessage } from "../api";
import { supabaseBrowserClient } from "@/db/supabase.client";

// Mock Supabase client
vi.mock("@/db/supabase.client", () => ({
  supabaseBrowserClient: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe("dashboard API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchReportsTodaySummary", () => {
    it("fetches summary successfully", async () => {
      const mockToken = "mock-token-123";
      const mockSummary = {
        totalActiveDrivers: 10,
        submittedCount: 7,
        pendingCount: 3,
        riskBreakdown: { none: 5, low: 1, medium: 0, high: 1 },
      };

      // Mock getSession
      vi.mocked(supabaseBrowserClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: mockToken } as any },
        error: null,
      });

      // Mock fetch
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockSummary,
      } as Response);

      const result = await fetchReportsTodaySummary("2025-01-15", "Europe/Warsaw");

      expect(result).toEqual(mockSummary);
      expect(global.fetch).toHaveBeenCalledWith("/api/reports/today/summary?timezone=Europe%2FWarsaw", {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });

    it("throws UNAUTHORIZED when no session", async () => {
      vi.mocked(supabaseBrowserClient.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(fetchReportsTodaySummary("2025-01-15", "Europe/Warsaw")).rejects.toThrow("UNAUTHORIZED");
    });

    it("throws error on failed request", async () => {
      vi.mocked(supabaseBrowserClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "token" } as any },
        error: null,
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(fetchReportsTodaySummary("2025-01-15", "Europe/Warsaw")).rejects.toThrow("Failed to fetch summary");
    });
  });

  describe("fetchTodayReports", () => {
    it("fetches reports successfully", async () => {
      const mockToken = "mock-token-123";
      const mockReports = [
        { uuid: "report-1", driverUuid: "driver-1" },
        { uuid: "report-2", driverUuid: "driver-2" },
      ];

      vi.mocked(supabaseBrowserClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: mockToken } as any },
        error: null,
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ items: mockReports }),
      } as Response);

      const result = await fetchTodayReports("2025-01-15", "Europe/Warsaw");

      expect(result).toEqual(mockReports);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/reports?from=2025-01-15&to=2025-01-15&includeAi=true&sortBy=reportDate&sortDir=desc",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it("returns empty array when no reports", async () => {
      vi.mocked(supabaseBrowserClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "token" } as any },
        error: null,
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response);

      const result = await fetchTodayReports("2025-01-15", "Europe/Warsaw");
      expect(result).toEqual([]);
    });
  });

  describe("fetchPendingDrivers", () => {
    it("calculates pending drivers correctly", async () => {
      const mockToken = "mock-token-123";
      const mockDrivers = [
        { uuid: "driver-1", name: "Jan Kowalski", email: "jan@test.com", timezone: "Europe/Warsaw" },
        { uuid: "driver-2", name: "Anna Nowak", email: "anna@test.com", timezone: "Europe/Warsaw" },
        { uuid: "driver-3", name: "Piotr Wiśniewski", email: "piotr@test.com", timezone: "Europe/Warsaw" },
      ];

      const mockReports = [
        { uuid: "report-1", driverUuid: "driver-1" }, // driver-1 has report
      ];

      vi.mocked(supabaseBrowserClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: mockToken } as any },
        error: null,
      });

      vi.mocked(global.fetch)
        // First call: drivers
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: mockDrivers }),
        } as Response)
        // Second call: reports
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: mockReports }),
        } as Response);

      const result = await fetchPendingDrivers("2025-01-15", "Europe/Warsaw");

      // Should return drivers 2 and 3 (no reports)
      expect(result).toHaveLength(2);
      expect(result.map((d) => d.uuid)).toEqual(["driver-2", "driver-3"]);
    });

    it("returns all drivers when no reports submitted", async () => {
      const mockDrivers = [{ uuid: "driver-1", name: "Test 1", email: "test1@test.com", timezone: "Europe/Warsaw" }];

      vi.mocked(supabaseBrowserClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "token" } as any },
        error: null,
      });

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: mockDrivers }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [] }),
        } as Response);

      const result = await fetchPendingDrivers("2025-01-15", "Europe/Warsaw");
      expect(result).toHaveLength(1);
    });

    it("returns empty array when all drivers submitted reports", async () => {
      const mockDrivers = [{ uuid: "driver-1", name: "Test", email: "test@test.com", timezone: "Europe/Warsaw" }];
      const mockReports = [{ uuid: "report-1", driverUuid: "driver-1" }];

      vi.mocked(supabaseBrowserClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "token" } as any },
        error: null,
      });

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: mockDrivers }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: mockReports }),
        } as Response);

      const result = await fetchPendingDrivers("2025-01-15", "Europe/Warsaw");
      expect(result).toEqual([]);
    });
  });

  describe("getErrorMessage", () => {
    it("returns message for UNAUTHORIZED error", () => {
      const error = new Error("UNAUTHORIZED");
      expect(getErrorMessage(error)).toBe("Sesja wygasła. Zaloguj się ponownie.");
    });

    it("returns message for network error", () => {
      const error = new Error("Failed to fetch: network error");
      expect(getErrorMessage(error)).toContain("Nie można połączyć się z serwerem");
    });

    it("returns message for 429 error", () => {
      const error = new Error("429 Too Many Requests");
      expect(getErrorMessage(error)).toContain("Przekroczono limit żądań");
    });

    it("returns message for 500 error", () => {
      const error = new Error("500 Internal Server Error");
      expect(getErrorMessage(error)).toContain("Wystąpił błąd serwera");
    });

    it("returns generic message for unknown errors", () => {
      const error = new Error("Some random error");
      expect(getErrorMessage(error)).toBe("Some random error");
    });

    it("handles non-Error objects", () => {
      const error = "string error";
      expect(getErrorMessage(error)).toBe("Wystąpił nieoczekiwany błąd.");
    });

    it("handles null/undefined errors", () => {
      expect(getErrorMessage(null)).toBe("Wystąpił nieoczekiwany błąd.");
      expect(getErrorMessage(undefined)).toBe("Wystąpił nieoczekiwany błąd.");
    });
  });
});
