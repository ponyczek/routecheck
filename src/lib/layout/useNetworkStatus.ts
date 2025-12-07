import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { NetworkStatus } from "./types";

/**
 * Custom hook for monitoring network status
 *
 * This hook:
 * - Listens to browser online/offline events
 * - Detects slow connections (optional, via navigator.connection)
 * - Shows toast notifications on status changes
 * - Returns current online status and network status
 *
 * @returns Object with isOnline boolean and status NetworkStatus
 */
export function useNetworkStatus(): { isOnline: boolean; status: NetworkStatus } {
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize from navigator.onLine
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  const [status, setStatus] = useState<NetworkStatus>("online");

  useEffect(() => {
    // Initialize status based on current online state
    if (!isOnline) {
      setStatus("offline");
    }

    /**
     * Handle online event
     */
    const handleOnline = () => {
      setIsOnline(true);
      setStatus("online");
      toast.success("Połączenie przywrócone", {
        duration: 3000,
      });
    };

    /**
     * Handle offline event
     */
    const handleOffline = () => {
      setIsOnline(false);
      setStatus("offline");
      toast.error("Brak połączenia z internetem", {
        duration: 5000,
      });
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Optional: Detect slow connections using Network Information API
    // This is experimental and not supported in all browsers
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      const updateConnectionStatus = () => {
        if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") {
          setStatus("slow");
          toast.warning("Wolne połączenie. Ładowanie może potrwać dłużej.", {
            duration: 4000,
          });
        } else if (isOnline) {
          setStatus("online");
        }
      };

      connection.addEventListener("change", updateConnectionStatus);

      // Cleanup for connection listener
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        connection.removeEventListener("change", updateConnectionStatus);
      };
    }

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOnline]);

  return { isOnline, status };
}
