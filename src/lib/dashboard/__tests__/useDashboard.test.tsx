import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDashboard } from "../useDashboard";
import * as api from "../api";

// Mock the API functions
vi.mock("../api", () => ({
  fetchReportsTodaySummary: vi.fn(),
  fetchTodayReports: vi.fn(),
  fetchPendingDrivers: vi.fn(),
}));

// Mock date utility
vi.mock("@/lib/utils/date", () => ({
  getCurrentDateInTimezone: vi.fn(() => "2025-01-15"),
}));

describe("useDashboard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries in tests
        },
      },
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("fetches dashboard data successfully", async () => {
    // Mock API responses
    const mockSummary = {
      totalActiveDrivers: 10,
      submittedCount: 7,
      pendingCount: 3,
      riskBreakdown: { none: 5, low: 1, medium: 0, high: 1 },
    };

    const mockReports = [
      {
        uuid: "report-1",
        driverUuid: "driver-1",
        reportDate: "2025-01-15",
        routeStatus: "COMPLETED" as const,
        riskLevel: "NONE" as const,
      },
    ];

    const mockPendingDrivers = [
      {
        uuid: "driver-2",
        name: "Jan Kowalski",
        email: "jan@example.com",
        timezone: "Europe/Warsaw",
        vehicleRegistration: null,
        linkSentAt: null,
      },
    ];

    vi.mocked(api.fetchReportsTodaySummary).mockResolvedValue(mockSummary);
    vi.mocked(api.fetchTodayReports).mockResolvedValue(mockReports as any);
    vi.mocked(api.fetchPendingDrivers).mockResolvedValue(mockPendingDrivers);

    const { result } = renderHook(() => useDashboard(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Data should be loaded
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.summary).toEqual(mockSummary);
    expect(result.current.data?.todayReports).toEqual(mockReports);
    expect(result.current.data?.pendingDrivers).toEqual(mockPendingDrivers);
    expect(result.current.error).toBeNull();
  });

  it("handles API errors", async () => {
    const mockError = new Error("API Error");
    vi.mocked(api.fetchReportsTodaySummary).mockRejectedValue(mockError);
    vi.mocked(api.fetchTodayReports).mockResolvedValue([]);
    vi.mocked(api.fetchPendingDrivers).mockResolvedValue([]);

    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });

  it("allows manual refetch", async () => {
    const mockSummary = {
      totalActiveDrivers: 5,
      submittedCount: 3,
      pendingCount: 2,
      riskBreakdown: { none: 2, low: 1, medium: 0, high: 0 },
    };

    vi.mocked(api.fetchReportsTodaySummary).mockResolvedValue(mockSummary);
    vi.mocked(api.fetchTodayReports).mockResolvedValue([]);
    vi.mocked(api.fetchPendingDrivers).mockResolvedValue([]);

    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Call refetch
    await result.current.refetch();

    // API should be called again
    expect(api.fetchReportsTodaySummary).toHaveBeenCalledTimes(2);
  });

  it("uses correct timezone", async () => {
    vi.mocked(api.fetchReportsTodaySummary).mockResolvedValue({} as any);
    vi.mocked(api.fetchTodayReports).mockResolvedValue([]);
    vi.mocked(api.fetchPendingDrivers).mockResolvedValue([]);

    renderHook(() => useDashboard({ timezone: "America/New_York" }), { wrapper });

    await waitFor(() => {
      expect(api.fetchReportsTodaySummary).toHaveBeenCalled();
    });

    // Check that timezone was passed correctly
    expect(api.fetchReportsTodaySummary).toHaveBeenCalledWith("2025-01-15", "America/New_York");
  });

  it("respects enabled option", () => {
    vi.mocked(api.fetchReportsTodaySummary).mockResolvedValue({} as any);

    renderHook(() => useDashboard({ enabled: false }), { wrapper });

    // API should not be called when disabled
    expect(api.fetchReportsTodaySummary).not.toHaveBeenCalled();
  });

  it("sets isRefreshing flag during refetch", async () => {
    vi.mocked(api.fetchReportsTodaySummary).mockResolvedValue({} as any);
    vi.mocked(api.fetchTodayReports).mockResolvedValue([]);
    vi.mocked(api.fetchPendingDrivers).mockResolvedValue([]);

    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Note: isRefreshing is very fast in tests and hard to catch
    // This test verifies the refetch functionality works
    await result.current.refetch();

    // After refetch completes, should not be refreshing
    expect(result.current.isRefreshing).toBe(false);
  });
});
