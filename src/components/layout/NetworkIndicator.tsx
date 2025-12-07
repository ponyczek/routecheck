import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNetworkStatus } from "@/lib/layout/useNetworkStatus";

/**
 * NetworkIndicator component
 *
 * Displays a badge indicating the current network status:
 * - Online: Green badge with wifi icon
 * - Offline: Red badge with wifi-off icon
 * - Slow: Yellow badge with alert icon
 *
 * Uses useNetworkStatus hook to monitor connection state.
 * Shows toast notifications on status changes (handled by hook).
 *
 * @returns Network status indicator badge
 */
export function NetworkIndicator() {
  const { status } = useNetworkStatus();

  // Determine status label for screen readers
  const statusLabel =
    status === "online"
      ? "Połączenie internetowe aktywne"
      : status === "slow"
        ? "Wolne połączenie internetowe"
        : "Brak połączenia internetowego";

  if (status === "online") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
        role="status"
        aria-label={statusLabel}
      >
        <Wifi className="h-3 w-3" aria-hidden="true" />
        <span className="text-xs">Online</span>
      </Badge>
    );
  }

  if (status === "slow") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
        role="status"
        aria-label={statusLabel}
      >
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        <span className="text-xs">Wolne</span>
      </Badge>
    );
  }

  // Offline
  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
      role="alert"
      aria-label={statusLabel}
    >
      <WifiOff className="h-3 w-3" aria-hidden="true" />
      <span className="text-xs">Offline</span>
    </Badge>
  );
}
