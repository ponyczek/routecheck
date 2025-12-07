import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import type { IsoDateString } from "@/types";
import { formatRelativeTime } from "@/lib/utils/date";

export interface LastUpdateIndicatorProps {
  lastUpdatedAt: IsoDateString;
  className?: string;
}

/**
 * LastUpdateIndicator - Shows relative time of last data update
 *
 * Features:
 * - Auto-updates every 10 seconds
 * - Formats time as "X sekund/minut/godzin temu"
 * - ARIA live region (polite) for screen readers
 * - Clock icon for visual clarity
 *
 * Example output: "Zaktualizowano 30 sekund temu"
 */
export function LastUpdateIndicator({ lastUpdatedAt, className }: LastUpdateIndicatorProps) {
  const [relativeTime, setRelativeTime] = React.useState(() => formatRelativeTime(lastUpdatedAt));

  // Update relative time every 10 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(lastUpdatedAt));
    }, 10_000); // 10s

    return () => clearInterval(interval);
  }, [lastUpdatedAt]);

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)}
      aria-live="polite"
      aria-atomic="true"
    >
      <Clock className="size-4" aria-hidden="true" />
      <span>Zaktualizowano {relativeTime}</span>
    </span>
  );
}
