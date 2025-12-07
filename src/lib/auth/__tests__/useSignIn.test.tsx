import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSignIn } from "../useSignIn";
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
      signInWithPassword: vi.fn(),
      getSession: vi.fn(),
    },
  } as unknown as SupabaseClient;
};

describe("useSignIn", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    vi.clearAllMocks();

    // Mock global fetch for /api/auth/set-session endpoint
    global.fetch = vi.fn((url) => {
      if (url === "/api/auth/set-session") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }
      return Promise.reject(new Error(`Unexpected fetch to ${url}`));
    });
  });

  it("should successfully sign in with valid credentials", async () => {
    const mockSession = {
      access_token: "token",
      refresh_token: "refresh_token",
      user: { id: "123", email: "test@example.com" },
    };
    const mockData = { session: mockSession, user: mockSession.user };

    vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
      data: mockData,
      error: null,
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignIn({
          supabase: mockSupabase,
          returnTo: "/dashboard",
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    // Call signIn
    result.current.signIn({
      email: "test@example.com",
      password: "password123",
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });

    expect(onSuccess).toHaveBeenCalledWith("/dashboard");
    expect(onError).not.toHaveBeenCalled();
  });

  it("should handle invalid credentials error", async () => {
    vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Invalid login credentials", name: "AuthError", status: 400 },
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignIn({
          supabase: mockSupabase,
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signIn({
      email: "wrong@example.com",
      password: "wrongpassword",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith({
      code: "invalid_credentials",
      message: expect.stringContaining("Nieprawidłowy email lub hasło"),
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("should handle email not confirmed error", async () => {
    vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Email not confirmed", name: "AuthError", status: 400 },
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignIn({
          supabase: mockSupabase,
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signIn({
      email: "unconfirmed@example.com",
      password: "password123",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith({
      code: "email_not_confirmed",
      message: expect.stringContaining("email nie został potwierdzony"),
    });
  });

  it("should handle rate limit error", async () => {
    vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "rate limit exceeded", name: "AuthError", status: 429 },
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignIn({
          supabase: mockSupabase,
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signIn({
      email: "test@example.com",
      password: "password123",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith({
      code: "rate_limited",
      message: expect.stringContaining("Zbyt wiele prób"),
    });
  });

  it("should use default /dashboard when returnTo is not provided", async () => {
    const mockSession = {
      access_token: "token",
      refresh_token: "refresh_token",
      user: { id: "123", email: "test@example.com" },
    };
    const mockData = { session: mockSession, user: mockSession.user };

    vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
      data: mockData,
      error: null,
    });

    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useSignIn({
          supabase: mockSupabase,
          onSuccess,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signIn({
      email: "test@example.com",
      password: "password123",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith("/dashboard");
  });

  it("should handle missing session after successful authentication", async () => {
    vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignIn({
          supabase: mockSupabase,
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    result.current.signIn({
      email: "test@example.com",
      password: "password123",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith({
      code: "unknown",
      message: expect.stringContaining("Nie udało się utworzyć sesji"),
    });
  });
});
