import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { supabaseBrowserClient } from "@/db/supabase.client";
import { fetchCurrentUser } from "@/lib/services/usersService";
import { fetchCurrentCompany } from "@/lib/services/companiesService";
import type { AuthContextValue } from "./types";

/**
 * Options for useAuthContext hook
 */
interface UseAuthContextOptions {
  /** Whether to enable the queries */
  enabled?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
}

/**
 * Custom hook for managing authentication context
 *
 * This hook:
 * - Fetches current user data from /api/users/me
 * - Fetches current company data from /api/companies/me
 * - Uses TanStack Query with stale-while-revalidate strategy
 * - Automatically redirects to /signin on 401 errors
 * - Provides signOut function
 * - Refetches data in background every 5 minutes
 *
 * @param options - Configuration options
 * @returns AuthContextValue with user, company, loading, error states and actions
 */
export function useAuthContext(options?: UseAuthContextOptions): AuthContextValue {
  const enabled = options?.enabled ?? true;
  const refetchInterval = options?.refetchInterval ?? 5 * 60 * 1000; // 5 minutes

  // Fetch user data
  const userQuery = useQuery({
    queryKey: ["user", "me"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: enabled ? refetchInterval : false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
    enabled,
  });

  // Fetch company data (only if user is loaded)
  const companyQuery = useQuery({
    queryKey: ["company", "me"],
    queryFn: fetchCurrentCompany,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: enabled ? refetchInterval : false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
    enabled: enabled && !!userQuery.data,
  });

  // Auto redirect on 401 (unauthorized)
  useEffect(() => {
    const isUnauthorized =
      userQuery.error?.message === "UNAUTHORIZED" || companyQuery.error?.message === "UNAUTHORIZED";

    if (isUnauthorized) {
      const currentPath = window.location.pathname;
      window.location.href = `/signin?returnTo=${encodeURIComponent(currentPath)}&expired=true&reason=timeout`;
    }
  }, [userQuery.error, companyQuery.error]);

  /**
   * Sign out the current user
   * Clears session and redirects to sign in page
   */
  const signOut = useCallback(async () => {
    try {
      await supabaseBrowserClient.auth.signOut();
      window.location.href = "/signin?reason=signed-out";
    } catch (error) {
      console.error("Sign out error:", error);
      // Force redirect even if sign out fails
      window.location.href = "/signin?reason=signed-out";
    }
  }, []);

  /**
   * Refresh user and company data
   */
  const refresh = useCallback(async () => {
    await Promise.all([userQuery.refetch(), companyQuery.refetch()]);
  }, [userQuery, companyQuery]);

  // Determine overall loading state
  const isLoading = userQuery.isLoading || (userQuery.data && companyQuery.isLoading) || false;

  // Determine overall error state (exclude 401 as we handle it with redirect)
  const error =
    userQuery.error?.message !== "UNAUTHORIZED" && userQuery.error
      ? userQuery.error
      : companyQuery.error?.message !== "UNAUTHORIZED" && companyQuery.error
        ? companyQuery.error
        : null;

  return {
    user: userQuery.data ?? null,
    company: companyQuery.data ?? null,
    isLoading,
    error,
    signOut,
    refresh,
  };
}
