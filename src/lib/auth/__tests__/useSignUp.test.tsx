import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSignUp } from "../useSignUp";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock Supabase client
const createMockSupabase = () => {
  return {
    auth: {
      signUp: vi.fn(),
      getUser: vi.fn(),
    },
  } as unknown as SupabaseClient;
};

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useSignUp", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    vi.clearAllMocks();
  });

  it("should successfully sign up with valid credentials and create company", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockSession = { access_token: "token-123", refresh_token: "refresh-123", user: mockUser };
    const mockAuthData = { session: mockSession, user: mockUser };
    const mockCompany = { uuid: "company-123", name: "Test Company", created_at: "2024-01-01" };

    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: mockAuthData,
      error: null,
    } as any);

    // Mock both API calls
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/companies") {
        return Promise.resolve({
          ok: true,
          json: async () => mockCompany,
        });
      }
      if (url === "/api/auth/set-session") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch to ${url}`));
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignUp({
          supabase: mockSupabase,
          returnTo: "/dashboard",
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    // Call signUp
    result.current.signUp({
      companyName: "Test Company",
      email: "test@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "SecurePass123",
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/companies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
      body: JSON.stringify({
        name: "Test Company",
        userUuid: "user-123",
      }),
    });

    expect(onSuccess).toHaveBeenCalledWith({
      redirectTo: "/dashboard",
      userId: "user-123",
      companyId: "company-123",
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it("should handle email already exists error", async () => {
    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "User already registered", name: "AuthError" } as any,
    } as any);

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignUp({
          supabase: mockSupabase,
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signUp({
      companyName: "Test Company",
      email: "existing@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith({
      code: "email_already_exists",
      message: expect.stringContaining("już istnieje"),
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("should handle weak password error", async () => {
    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Password is too weak", name: "AuthError" } as any,
    } as any);

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignUp({
          supabase: mockSupabase,
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signUp({
      companyName: "Test Company",
      email: "test@example.com",
      password: "weak",
      confirmPassword: "weak",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith({
      code: "weak_password",
      message: expect.stringContaining("za słabe"),
    });
  });

  it("should handle rate limit error", async () => {
    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "rate limit exceeded", name: "AuthError", status: 429 } as any,
    } as any);

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignUp({
          supabase: mockSupabase,
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signUp({
      companyName: "Test Company",
      email: "test@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith({
      code: "rate_limited",
      message: expect.stringContaining("Zbyt wiele prób"),
    });
  });

  it("should handle company creation failure", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockSession = { access_token: "token-123", user: mockUser };
    const mockAuthData = { session: mockSession, user: mockUser };

    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: mockAuthData,
      error: null,
    } as any);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ code: "internal_error", message: "Database error" }),
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignUp({
          supabase: mockSupabase,
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signUp({
      companyName: "Test Company",
      email: "test@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockSupabase.auth.signUp).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith({
      code: "company_creation_failed",
      message: expect.stringContaining("Nie udało się utworzyć firmy"),
      details: expect.any(Object),
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("should handle network error", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockSession = { access_token: "token-123", user: mockUser };
    const mockAuthData = { session: mockSession, user: mockUser };

    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: mockAuthData,
      error: null,
    } as any);

    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignUp({
          supabase: mockSupabase,
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signUp({
      companyName: "Test Company",
      email: "test@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith({
      code: "network",
      message: expect.stringContaining("Błąd połączenia"),
    });
  });

  it("should use default /dashboard when returnTo is not provided", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockSession = { access_token: "token-123", refresh_token: "refresh-123", user: mockUser };
    const mockAuthData = { session: mockSession, user: mockUser };
    const mockCompany = { uuid: "company-123", name: "Test Company", created_at: "2024-01-01" };

    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: mockAuthData,
      error: null,
    } as any);

    // Mock both API calls
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/companies") {
        return Promise.resolve({
          ok: true,
          json: async () => mockCompany,
        });
      }
      if (url === "/api/auth/set-session") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch to ${url}`));
    });

    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useSignUp({
          supabase: mockSupabase,
          onSuccess,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signUp({
      companyName: "Test Company",
      email: "test@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectTo: "/dashboard",
      })
    );
  });

  it("should handle missing session after successful authentication", async () => {
    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignUp({
          supabase: mockSupabase,
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signUp({
      companyName: "Test Company",
      email: "test@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith({
      code: "unknown",
      message: expect.stringContaining("Nie udało się utworzyć konta"),
    });
  });

  it("should reset mutation state", async () => {
    const { result } = renderHook(
      () =>
        useSignUp({
          supabase: mockSupabase,
        }),
      { wrapper: createWrapper() }
    );

    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Some error", name: "AuthError" } as any,
    } as any);

    result.current.signUp({
      companyName: "Test Company",
      email: "test@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Reset the mutation
    result.current.reset();

    await waitFor(() => {
      expect(result.current.isError).toBe(false);
    });

    expect(result.current.error).toBe(null);
  });
});

