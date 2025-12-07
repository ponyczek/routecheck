import { useState, useEffect, useCallback } from "react";
import { supabaseBrowserClient } from "@/db/supabase.client";
import { transformSupabaseSession } from "./sessionTransformers";
import type { SessionViewModel } from "./types";

/**
 * Wynik hooka useSessionData
 */
interface UseSessionDataResult {
  /** Dane sesji lub null jeśli brak sesji */
  session: SessionViewModel | null;
  /** Stan ładowania */
  isLoading: boolean;
  /** Błąd podczas pobierania sesji */
  error: Error | null;
  /** Funkcja do odświeżenia danych sesji */
  refresh: () => Promise<void>;
}

/**
 * Hook do pobierania i transformacji danych sesji użytkownika
 *
 * Pobiera aktualną sesję z Supabase Auth i transformuje ją do formatu
 * potrzebnego w UI (SessionViewModel). Obsługuje stany ładowania i błędów.
 *
 * @param initialSession - Opcjonalne początkowe dane sesji (z server-side)
 * @returns Obiekt z danymi sesji, stanem ładowania, błędem i funkcją refresh
 *
 * @example
 * ```tsx
 * const { session, isLoading, error, refresh } = useSessionData();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (!session) return <NoSessionMessage />;
 *
 * return <SessionInfo session={session} />;
 * ```
 */
export function useSessionData(initialSession?: SessionViewModel): UseSessionDataResult {
  const [session, setSession] = useState<SessionViewModel | null>(initialSession || null);
  const [isLoading, setIsLoading] = useState(!initialSession);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Pobiera i transformuje dane sesji z Supabase
   */
  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { session: supabaseSession },
        error: sessionError,
      } = await supabaseBrowserClient.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!supabaseSession) {
        setSession(null);
        return;
      }

      // Transform Supabase session to SessionViewModel
      const viewModel = transformSupabaseSession(supabaseSession);
      setSession(viewModel);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount (tylko jeśli nie ma initialSession)
  useEffect(() => {
    if (!initialSession) {
      fetchSession();
    }
  }, [fetchSession, initialSession]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  return { session, isLoading, error, refresh };
}
