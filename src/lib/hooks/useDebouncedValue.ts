import { useState, useEffect } from "react";

/**
 * Hook do debounce'owania wartości
 * Przydatny dla wyszukiwarek - czeka określony czas przed aktualizacją wartości
 *
 * @param value - Wartość do zdebounce'owania
 * @param delay - Opóźnienie w milisekundach (domyślnie 300ms)
 * @returns Zdebounce'owana wartość
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Ustaw timer do aktualizacji wartości po upływie delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup - anuluj timer jeśli wartość się zmieni przed upływem delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

