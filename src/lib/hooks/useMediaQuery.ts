import { useState, useEffect } from "react";

/**
 * useMediaQuery
 * 
 * Hook do sprawdzania media queries w React.
 * Używany do responsywnego renderowania komponentów (Dialog vs Sheet).
 * 
 * @param query - Media query string (np. "(min-width: 768px)")
 * @returns boolean - true jeśli query pasuje
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } 
    // Legacy browsers (fallback)
    else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}


