import { useState, useCallback } from "react";

/**
 * Hook do zarządzania paginacją cursorową
 * Przechowuje stack poprzednich kursorów aby umożliwić nawigację wstecz
 */
export function usePagination() {
  const [prevCursors, setPrevCursors] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>();

  /**
   * Przejdź do następnej strony
   */
  const goToNext = useCallback(
    (nextCursor: string) => {
      if (currentCursor) {
        // Dodaj aktualny cursor do stacku poprzednich
        setPrevCursors((prev) => [...prev, currentCursor]);
      }
      setCurrentCursor(nextCursor);
    },
    [currentCursor]
  );

  /**
   * Przejdź do poprzedniej strony
   */
  const goToPrev = useCallback(() => {
    const newPrevCursors = [...prevCursors];
    const prevCursor = newPrevCursors.pop();
    setPrevCursors(newPrevCursors);
    setCurrentCursor(prevCursor);
  }, [prevCursors]);

  /**
   * Sprawdź czy istnieje następna strona
   */
  const hasNext = useCallback((nextCursor: string | null) => {
    return nextCursor !== null;
  }, []);

  /**
   * Sprawdź czy istnieje poprzednia strona
   */
  const hasPrev = prevCursors.length > 0;

  /**
   * Resetuj paginację (powrót do pierwszej strony)
   */
  const reset = useCallback(() => {
    setPrevCursors([]);
    setCurrentCursor(undefined);
  }, []);

  return {
    currentCursor,
    goToNext,
    goToPrev,
    hasNext,
    hasPrev,
    reset,
  };
}

