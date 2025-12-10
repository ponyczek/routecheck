import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAssignments } from "../useAssignments";
import type { ReactNode } from "react";

// Mock fetch
global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryClientWrapper";

  return Wrapper;
};

describe("useAssignments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should transform assignments to ViewModels with correct status", async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    // Mock responses
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              uuid: "assignment-1",
              driverUuid: "driver-1",
              vehicleUuid: "vehicle-1",
              companyUuid: "company-1",
              startDate: yesterday,
              endDate: tomorrow,
            },
            {
              uuid: "assignment-2",
              driverUuid: "driver-2",
              vehicleUuid: "vehicle-2",
              companyUuid: "company-1",
              startDate: tomorrow,
              endDate: nextWeek,
            },
            {
              uuid: "assignment-3",
              driverUuid: "driver-1",
              vehicleUuid: "vehicle-2",
              companyUuid: "company-1",
              startDate: "2023-01-01",
              endDate: "2023-12-31",
            },
          ],
          nextCursor: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { uuid: "driver-1", name: "Jan Kowalski", email: "jan@example.com", isActive: true },
            { uuid: "driver-2", name: "Anna Nowak", email: "anna@example.com", isActive: true },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { uuid: "vehicle-1", registrationNumber: "ABC123", isActive: true },
            { uuid: "vehicle-2", registrationNumber: "XYZ789", isActive: true },
          ],
        }),
      });

    const { result } = renderHook(
      () =>
        useAssignments({
          sortBy: "startDate",
          sortDir: "asc",
          limit: 50,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const assignments = result.current.data || [];
    expect(assignments).toHaveLength(3);

    // Active assignment (yesterday - tomorrow)
    expect(assignments[0].status).toBe("active");
    expect(assignments[0].isActive).toBe(true);
    expect(assignments[0].driverName).toBe("Jan Kowalski");
    expect(assignments[0].vehicleRegistration).toBe("ABC123");
    expect(assignments[0].daysRemaining).toBeGreaterThan(0);

    // Upcoming assignment (tomorrow - next week)
    expect(assignments[1].status).toBe("upcoming");
    expect(assignments[1].isActive).toBe(false);
    expect(assignments[1].driverName).toBe("Anna Nowak");
    expect(assignments[1].vehicleRegistration).toBe("XYZ789");
    expect(assignments[1].daysRemaining).toBe(null);

    // Completed assignment (2023)
    expect(assignments[2].status).toBe("completed");
    expect(assignments[2].isActive).toBe(false);
    expect(assignments[2].daysRemaining).toBe(null);
  });

  it("should handle assignment without endDate (bezterminowe)", async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              uuid: "assignment-1",
              driverUuid: "driver-1",
              vehicleUuid: "vehicle-1",
              companyUuid: "company-1",
              startDate: yesterday,
              endDate: null,
            },
          ],
          nextCursor: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ uuid: "driver-1", name: "Jan Kowalski", isActive: true }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ uuid: "vehicle-1", registrationNumber: "ABC123", isActive: true }] }),
      });

    const { result } = renderHook(() => useAssignments({ sortBy: "startDate", sortDir: "asc", limit: 50 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const assignments = result.current.data || [];
    expect(assignments).toHaveLength(1);
    expect(assignments[0].status).toBe("active");
    expect(assignments[0].isActive).toBe(true);
    expect(assignments[0].daysRemaining).toBe(null); // No endDate
  });

  it('should handle missing driver/vehicle (show "Nieznany")', async () => {
    const today = new Date().toISOString().split("T")[0];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              uuid: "assignment-1",
              driverUuid: "nonexistent-driver",
              vehicleUuid: "nonexistent-vehicle",
              companyUuid: "company-1",
              startDate: today,
              endDate: null,
            },
          ],
          nextCursor: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }), // No drivers
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }), // No vehicles
      });

    const { result } = renderHook(() => useAssignments({ sortBy: "startDate", sortDir: "asc", limit: 50 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const assignments = result.current.data || [];
    expect(assignments).toHaveLength(1);
    expect(assignments[0].driverName).toBe("Nieznany kierowca");
    expect(assignments[0].vehicleRegistration).toBe("Nieznany pojazd");
  });

  it("should build query params from filters", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], nextCursor: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

    const { result } = renderHook(
      () =>
        useAssignments({
          driverUuid: "driver-1",
          vehicleUuid: "vehicle-1",
          activeOn: "2024-01-15",
          sortBy: "startDate",
          sortDir: "desc",
          limit: 25,
          cursor: "next-cursor",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check that fetch was called with correct params
    const fetchCall = (global.fetch as any).mock.calls[0][0];
    expect(fetchCall).toContain("driverUuid=driver-1");
    expect(fetchCall).toContain("vehicleUuid=vehicle-1");
    expect(fetchCall).toContain("activeOn=2024-01-15");
    expect(fetchCall).toContain("sortBy=startDate");
    expect(fetchCall).toContain("sortDir=desc");
    expect(fetchCall).toContain("limit=25");
    expect(fetchCall).toContain("cursor=next-cursor");
  });
});
