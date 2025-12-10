import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreateAssignment } from "../useCreateAssignment";
import { useUpdateAssignment } from "../useUpdateAssignment";
import { useDeleteAssignment } from "../useDeleteAssignment";
import { toast } from "sonner";
import type { ReactNode } from "react";

// Mock fetch and toast
global.fetch = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryClientWrapper";

  return Wrapper;
};

describe("useCreateAssignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create assignment successfully", async () => {
    const mockAssignment = {
      uuid: "new-assignment",
      driverUuid: "driver-1",
      vehicleUuid: "vehicle-1",
      companyUuid: "company-1",
      startDate: "2024-01-15",
      endDate: "2024-12-31",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAssignment,
    });

    const { result } = renderHook(() => useCreateAssignment(), {
      wrapper: createWrapper(),
    });

    const command = {
      driverUuid: "driver-1",
      vehicleUuid: "vehicle-1",
      startDate: "2024-01-15",
      endDate: "2024-12-31",
    };

    result.current.mutate(command);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });

    expect(toast.success).toHaveBeenCalledWith("Przypisanie zostało dodane");
  });

  it("should not show toast for conflict error (409)", async () => {
    const conflictError = {
      code: "ASSIGNMENT_OVERLAP",
      message: "Konflikt przypisań",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => conflictError,
    });

    const { result } = renderHook(() => useCreateAssignment(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      driverUuid: "driver-1",
      vehicleUuid: "vehicle-1",
      startDate: "2024-01-15",
      endDate: null,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Toast error should NOT be called for 409
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should show toast for other errors", async () => {
    const error = {
      code: "VALIDATION_ERROR",
      message: "Invalid data",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => error,
    });

    const { result } = renderHook(() => useCreateAssignment(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      driverUuid: "driver-1",
      vehicleUuid: "vehicle-1",
      startDate: "2024-01-15",
      endDate: null,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith("Invalid data");
  });
});

describe("useUpdateAssignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update assignment successfully", async () => {
    const mockAssignment = {
      uuid: "assignment-1",
      driverUuid: "driver-1",
      vehicleUuid: "vehicle-2",
      companyUuid: "company-1",
      startDate: "2024-01-15",
      endDate: "2024-12-31",
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAssignment,
    });

    const { result } = renderHook(() => useUpdateAssignment(), {
      wrapper: createWrapper(),
    });

    const command = {
      uuid: "assignment-1",
      data: {
        vehicleUuid: "vehicle-2",
      },
    };

    result.current.mutate(command);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith("/api/assignments/assignment-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command.data),
    });

    expect(toast.success).toHaveBeenCalledWith("Przypisanie zostało zaktualizowane");
  });

  it("should handle 404 error (not found)", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Not found" }),
    });

    const { result } = renderHook(() => useUpdateAssignment(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      uuid: "nonexistent",
      data: { startDate: "2024-01-15" },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith("Nie znaleziono przypisania. Mogło zostać już usunięte.");
  });
});

describe("useDeleteAssignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete assignment successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const { result } = renderHook(() => useDeleteAssignment(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("assignment-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith("/api/assignments/assignment-1", {
      method: "DELETE",
    });

    expect(toast.success).toHaveBeenCalledWith("Przypisanie zostało usunięte");
  });

  it("should handle 404 error (already deleted)", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Not found" }),
    });

    const { result } = renderHook(() => useDeleteAssignment(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("nonexistent");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith("Nie znaleziono przypisania. Mogło zostać już usunięte.");
  });
});
