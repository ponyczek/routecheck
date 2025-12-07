import { useState, useEffect } from 'react';

/**
 * Hook to monitor online/offline network status
 * Listens to window online/offline events
 * 
 * @returns boolean indicating if the browser is online
 * 
 * @example
 * const isOnline = useNetworkStatus();
 * 
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}


