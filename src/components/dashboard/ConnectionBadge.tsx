import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

export interface ConnectionBadgeProps {
  isOnline: boolean;
  refetchInterval?: number;
  className?: string;
}

/**
 * ConnectionBadge - Shows connection status and refresh mode
 *
 * Displays:
 * - Online: Green badge with "Online – odświeżanie co Xs"
 * - Offline: Red badge with "Offline"
 *
 * Features:
 * - Auto-updates when online status changes
 * - Shows refetch interval in human-readable format
 * - WCAG compliant colors with icons
 */
export function ConnectionBadge({ isOnline, refetchInterval = 60000, className }: ConnectionBadgeProps) {
  const intervalText = React.useMemo(() => {
    const seconds = Math.floor(refetchInterval / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  }, [refetchInterval]);

  return (
    <Badge
      className={cn(
        "fixed bottom-4 right-4 z-50 shadow-lg transition-all",
        isOnline
          ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
          : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={isOnline ? `Połączenie aktywne, automatyczne odświeżanie co ${intervalText}` : "Brak połączenia"}
    >
      {isOnline ? (
        <>
          <Wifi className="size-3" aria-hidden="true" />
          <span>Online – odświeżanie co {intervalText}</span>
        </>
      ) : (
        <>
          <WifiOff className="size-3" aria-hidden="true" />
          <span>Offline</span>
        </>
      )}
    </Badge>
  );
}

